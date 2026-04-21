/**
 * Sera Secrets Worker
 *
 * Environment bindings (set these with `wrangler secret put` and KV namespace bindings):
 * - SECRETS (KV namespace binding)
 * - MASTER_KEY (base64-encoded 32-byte AES key)
 * - ADMIN_TOKEN (a strong random string used to authenticate admin requests)
 *
 * Endpoints:
 * - POST /secrets         -> { name, value } (stores encrypted secret)  (ADMIN only)
 * - GET  /secrets         -> lists secret names (ADMIN only)
 * - GET  /secrets/:name   -> returns { name, value } (ADMIN only)
 * - DELETE /secrets/:name -> deletes secret (ADMIN only)
 */

function b64ToUint8Array(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function arrayBufferToB64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function importKeyFromBase64(masterKeyBase64) {
  const raw = b64ToUint8Array(masterKeyBase64);
  return crypto.subtle.importKey("raw", raw.buffer, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptText(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  return { iv: arrayBufferToB64(iv), ciphertext: arrayBufferToB64(ciphertext) };
}

async function decryptText(ciphertextB64, ivB64, key) {
  const ct = b64ToUint8Array(ciphertextB64);
  const iv = b64ToUint8Array(ivB64);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct,
  );
  return new TextDecoder().decode(decrypted);
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "");
    const method = request.method.toUpperCase();

    // Health
    if (pathname === "" || pathname === "/")
      return new Response("Sera Secrets Worker", { status: 200 });
    if (pathname === "/health") return new Response("ok", { status: 200 });

    // Public config endpoint (no admin token required)
    if (pathname === "/public-config" && method === "GET") {
      return publicConfigHandler(env);
    }

    // Moderation proxy (client can POST text; worker calls AI provider)
    if (pathname === "/moderate" && method === "POST") {
      return moderateHandler(request, env);
    }

    // Ensure required envs
    if (!env.SECRETS)
      return new Response("Server misconfigured: SECRETS KV binding missing", {
        status: 500,
      });
    if (!env.ADMIN_TOKEN)
      return new Response("Server misconfigured: ADMIN_TOKEN missing", {
        status: 500,
      });
    if (!env.MASTER_KEY)
      return new Response("Server misconfigured: MASTER_KEY missing", {
        status: 500,
      });

    const auth = request.headers.get("Authorization") || "";
    const isAdmin = auth === `Bearer ${env.ADMIN_TOKEN}`;

    // All /secrets routes require admin auth
    if (pathname === "/secrets") {
      if (!isAdmin) return new Response("Unauthorized", { status: 401 });

      if (method === "POST") {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return new Response("Invalid JSON body", { status: 400 });
        }
        const { name, value } = body || {};
        if (!name || typeof value === "undefined")
          return new Response("Bad Request: name and value required", {
            status: 400,
          });

        try {
          const key = await importKeyFromBase64(env.MASTER_KEY);
          const { iv, ciphertext } = await encryptText(String(value), key);
          const payload = {
            iv,
            ciphertext,
            createdAt: new Date().toISOString(),
          };
          await env.SECRETS.put(name, JSON.stringify(payload));
          return jsonResponse({ ok: true, name }, 201);
        } catch (err) {
          return new Response("Encryption/storage error: " + String(err), {
            status: 500,
          });
        }
      }

      if (method === "GET") {
        try {
          const list = await env.SECRETS.list();
          return jsonResponse({ keys: list.keys.map((k) => k.name) });
        } catch (err) {
          return new Response("KV list error: " + String(err), { status: 500 });
        }
      }

      return new Response("Method Not Allowed", { status: 405 });
    }

    // /secrets/:name (GET, DELETE)
    if (pathname.startsWith("/secrets/")) {
      if (!isAdmin) return new Response("Unauthorized", { status: 401 });
      const name = decodeURIComponent(pathname.slice("/secrets/".length));
      if (!name)
        return new Response("Bad Request: missing name", { status: 400 });

      if (method === "GET") {
        try {
          const raw = await env.SECRETS.get(name);
          if (!raw) return new Response("Not Found", { status: 404 });
          const obj = JSON.parse(raw);
          const key = await importKeyFromBase64(env.MASTER_KEY);
          const value = await decryptText(obj.ciphertext, obj.iv, key);
          return jsonResponse({ name, value });
        } catch (err) {
          return new Response("Decrypt error: " + String(err), { status: 500 });
        }
      }

      if (method === "DELETE") {
        try {
          await env.SECRETS.delete(name);
          return jsonResponse({ ok: true, name });
        } catch (err) {
          return new Response("Delete error: " + String(err), { status: 500 });
        }
      }

      return new Response("Method Not Allowed", { status: 405 });
    }

    return new Response("Not Found", { status: 404 });
  },
};

// --- Helpers / Public endpoints ---

async function getDecryptedSecret(name, env) {
  const raw = await env.SECRETS.get(name);
  if (!raw) return null;
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    return null;
  }
  const key = await importKeyFromBase64(env.MASTER_KEY);
  const value = await decryptText(obj.ciphertext, obj.iv, key);
  return value;
}

async function publicConfigHandler(env) {
  const PUBLIC_KEYS = [
    "FIREBASE_API_KEY",
    "FIREBASE_AUTH_DOMAIN",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_MESSAGING_SENDER_ID",
    "FIREBASE_APP_ID",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_UPLOAD_PRESET",
  ];
  const out = {};
  try {
    for (const k of PUBLIC_KEYS) {
      const v = await getDecryptedSecret(k, env);
      if (v) out[k] = v;
    }
    return jsonResponse(out, 200);
  } catch (err) {
    return new Response("public-config error: " + String(err), { status: 500 });
  }
}

async function moderateHandler(request, env) {
  try {
    const body = await request.json();
    const text = body?.text;
    if (!text)
      return new Response("Bad Request: missing text", { status: 400 });
    const geminiKey = await getDecryptedSecret("GEMINI_KEY", env);
    if (!geminiKey)
      return new Response("Server misconfigured: GEMINI_KEY missing", {
        status: 500,
      });

    const prompt = `Classify the following text for safety. Respond with exactly SAFE or UNSAFE. If UNSAFE, briefly state the reason after a colon.\n\nText:\n\"\"\"\n${text}\n\"\"\"`;
    const bodyPayload = {
      prompt: {
        messages: [
          {
            content: { text: prompt },
            role: "user",
          },
        ],
      },
      maxOutputTokens: 200,
    };

    const API_URL = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${geminiKey}`;
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) return new Response("AI provider failed", { status: 502 });
    const json = await res.json();
    const out =
      json?.candidates?.[0]?.content?.[0]?.text ||
      json?.output?.[0]?.content?.text ||
      JSON.stringify(json);
    const textResp = String(out).trim();
    if (textResp.startsWith("UNSAFE")) {
      const parts = textResp.split(":");
      return jsonResponse({ safe: false, reason: (parts[1] || "").trim() });
    }
    return jsonResponse({ safe: true, reason: textResp });
  } catch (e) {
    return new Response("Moderation error: " + String(e), { status: 500 });
  }
}

// Attach the handlers to the default export so the same file can be used to
// route requests in different environments if needed.
export { moderateHandler, publicConfigHandler };
