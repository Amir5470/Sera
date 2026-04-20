// Refactored: call Firebase Cloud Functions instead of calling AI providers
// directly from the client. Set `EXPO_PUBLIC_FUNCTIONS_BASE` to the
// functions base URL (for example `https://us-central1-YOUR_PROJECT.cloudfunctions.net/api`).

const FUNCTIONS_BASE = process.env.EXPO_PUBLIC_FUNCTIONS_BASE || "";

function ensureBase() {
  if (!FUNCTIONS_BASE)
    throw new Error("EXPO_PUBLIC_FUNCTIONS_BASE is not configured");
}

async function callFunction(endpoint: string, base64: string) {
  ensureBase();
  const url = `${FUNCTIONS_BASE.replace(/\/+$/, "")}/${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64 }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "<no-body>");
    console.error("Functions request failed", endpoint, res.status, text);
    throw new Error("Functions request failed");
  }
  const json = await res.json().catch((e) => {
    console.error("Failed to parse functions JSON", e);
    throw e;
  });
  if (!Array.isArray(json)) {
    console.error("Unexpected functions response, expected JSON array", json);
    throw new Error("Invalid functions response");
  }
  return json;
}

export const extractClasses = async (base64: string) => {
  return callFunction("extractClasses", base64);
};

export const extractTimes = async (base64: string) => {
  return callFunction("extractTimes", base64);
};

export default { extractClasses, extractTimes };
