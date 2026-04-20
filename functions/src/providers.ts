import axios from "axios";

const GEMINI_KEY = process.env.GEMINI_KEY;
const ANTHROPIC_KEY =
  process.env.ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

type ExtractType = "classes" | "times";

function buildPrompt(type: ExtractType) {
  if (type === "classes") {
    return `You will be given a base64-encoded photo of a student's schedule. Return ONLY a JSON array, example:\n[{"name":"Algebra","teacher":"Mrs. Smith","period":"1","emoji":"📐","type":"class"}]\nDo not add any explanation or text.`;
  }
  return `You will be given a base64-encoded photo of bell times. Return ONLY a JSON array, example:\n[{"period":"1","startTime":"08:40","endTime":"09:30"}]\nDo not add any explanation or text.`;
}

function extractJsonFromText(text: string) {
  if (!text || typeof text !== "string")
    throw new Error("Empty response from model");

  // Try direct parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // ignore
  }

  // Try to extract first JSON array substring
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.substring(start, end + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // continue
    }
  }

  // Try code block extraction ```json ... ```
  const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (m && m[1]) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // ignore
    }
  }

  throw new Error("Unable to parse JSON array from model response");
}

export async function callAnthropic(base64: string, type: ExtractType) {
  if (!ANTHROPIC_KEY)
    throw new Error("Anthropic API key is not configured in environment");
  const prompt = buildPrompt(type);

  const url = "https://api.anthropic.com/v1/messages";
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": ANTHROPIC_KEY,
    "anthropic-version": "2023-06-01",
  } as Record<string, string>;

  try {
    const resp = await axios.post(url, body, { headers, timeout: 120000 });
    const data = resp.data as any;
    const raw =
      data?.messages?.[0]?.content?.[0]?.text ||
      data?.content?.[0]?.text ||
      JSON.stringify(data);
    return extractJsonFromText(raw);
  } catch (err) {
    console.error("callAnthropic error", err);
    throw err;
  }
}

export async function callGemini(base64: string, type: ExtractType) {
  if (!GEMINI_KEY)
    throw new Error("Gemini API key is not configured in environment");
  const prompt = buildPrompt(type);

  // Using the Generative Language HTTP API (v1beta2). The API shape can vary;
  // we include the base64 inline in the prompt text to ensure the model sees it.
  const API_URL = `https://generativelanguage.googleapis.com/v1beta2/models/${GEMINI_MODEL}:generate?key=${GEMINI_KEY}`;
  const body = {
    prompt: {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${prompt}\n\nImage (base64):\n${base64}`,
            },
          ],
        },
      ],
    },
    maxOutputTokens: 800,
  };

  try {
    const resp = await axios.post(API_URL, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    });
    const data = resp.data as any;
    const out =
      data?.candidates?.[0]?.content?.[0]?.text ||
      data?.output?.[0]?.content?.text ||
      JSON.stringify(data);
    return extractJsonFromText(out);
  } catch (err) {
    console.error("callGemini error", err?.response?.data || err);
    throw err;
  }
}

export async function callProvider(base64: string, type: ExtractType) {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider === "anthropic") return callAnthropic(base64, type);
  return callGemini(base64, type);
}
