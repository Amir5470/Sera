import fetchWithLimit from "./fetchWithLimit";

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export async function moderateText(text: string) {
  if (!ANTHROPIC_KEY) return { safe: true, reason: "no-key" };
  const prompt = `Classify the following text for safety. Respond with exactly SAFE or UNSAFE. Text:\n"""\n${text}\n"""\nIf UNSAFE, briefly state the reason after a colon.`;

  const body = JSON.stringify({
    model: "claude-1",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const res = await fetchWithLimit("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
      },
      body,
    });
    if (!res.ok) return { safe: true, reason: "api-failed" };
    const data = await res.json();
    const raw = data?.content?.[0]?.text || data?.output || "";
    const textResp = String(raw).trim();
    if (textResp.startsWith("UNSAFE")) {
      const parts = textResp.split(":");
      return { safe: false, reason: (parts[1] || "").trim() };
    }
    return { safe: true, reason: textResp };
  } catch (e) {
    return { safe: true, reason: "error" };
  }
}

export default { moderateText };
