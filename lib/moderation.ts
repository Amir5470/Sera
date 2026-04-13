import fetchWithLimit from "./fetchWithLimit";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

export async function moderateText(text: string) {
  if (!GEMINI_KEY) return { safe: true, reason: "no-key" };
  const prompt = `Classify the following text for safety. Respond with exactly SAFE or UNSAFE. If UNSAFE, briefly state the reason after a colon.\n\nText:\n"""\n${text}\n"""`;

  const body = {
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

  try {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${GEMINI_KEY}`;
    const res = await fetchWithLimit(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { safe: true, reason: "api-failed" };
    const json = await res.json();
    const out =
      json?.candidates?.[0]?.content?.[0]?.text ||
      json?.output?.[0]?.content?.text ||
      JSON.stringify(json);
    const textResp = String(out).trim();
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
