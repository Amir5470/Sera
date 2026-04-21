const WORKER_URL =
  process.env.EXPO_PUBLIC_SECRETS_WORKER_URL ||
  "https://sera-secrets-worker.amirmechkour5474.workers.dev";

export async function moderateText(text: string) {
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/+$/, "")}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { safe: true, reason: "api-failed" };
    const json = await res.json();
    // Expect { safe: boolean, reason: string }
    if (typeof json.safe === "boolean") return json;
    return { safe: true, reason: String(json) };
  } catch (e) {
    return { safe: true, reason: "error" };
  }
}

export default { moderateText };
