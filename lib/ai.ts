import fetchWithLimit from "./fetchWithLimit";

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
// Default to Gemini when no provider is specified
const AI_PROVIDER = process.env.EXPO_PUBLIC_AI_PROVIDER || "gemini";

const CLAUDE_MODEL = "claude-3-5-haiku-20241022";

/**
 * callAnthropic
 *
 * Sends an image (base64) and a textual prompt to the Anthropic multimodal
 * endpoint and attempts to extract a JSON array from the model's response.
 * Throws when the API key is missing or when the response cannot be parsed.
 *
 * @param base64 - Image data encoded as base64
 * @param prompt - Textual prompt instructing the model how to format output
 * @returns Parsed JSON array from the model's response
 */
const callAnthropic = async (base64: string, prompt: string) => {
  if (!ANTHROPIC_KEY) throw new Error("Missing ANTHROPIC key");
  try {
    const response = await fetchWithLimit(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
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
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "<no-body>");
      console.error("Anthropic API error", response.status, body);
      throw new Error(`Anthropic API ${response.status}`);
    }

    const data = await response.json().catch((e) => {
      console.error("Anthropic response JSON parse failed", e);
      throw e;
    });

    const raw =
      data?.messages?.[0]?.content?.[0]?.text ||
      data?.content?.[0]?.text ||
      (typeof data === "string" ? data : JSON.stringify(data));

    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) {
      console.error("Anthropic response missing JSON array", { raw, data });
      throw new Error("No JSON array found");
    }
    return JSON.parse(raw.substring(start, end + 1));
  } catch (err) {
    console.error("callAnthropic failed", err);
    throw err;
  }
};

/**
 * callGemini
 *
 * Sends the base64 image and prompt to Google's Generative Language API and
 * attempts to parse a JSON array from the returned text.
 *
 * @param base64 - Image data encoded as base64
 * @param prompt - Textual instruction for output formatting
 * @returns Parsed JSON array
 */
const callGemini = async (base64: string, prompt: string) => {
  if (!GEMINI_KEY) throw new Error("Missing GEMINI key");
  try {
    // Use the :generate endpoint (more widely supported for prompt payloads)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash:generate?key=${GEMINI_KEY}`;
    const body = {
      prompt: {
        messages: [
          {
            role: "user",
            content: [
              // Note: some Gemini endpoints accept a content array; keep the text prompt here.
              {
                type: "text",
                text: `Extract schedule info from the attached image and return ONLY a JSON array as instructed.\n\nInstructions: ${prompt}`,
              },
            ],
          },
        ],
      },
      maxOutputTokens: 800,
    };
    const res = await fetchWithLimit(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "<no-body>");
      console.error("Gemini API error", res.status, bodyText);
      throw new Error(`Gemini API ${res.status}`);
    }
    const json = await res.json().catch((e) => {
      console.error("Gemini response JSON parse failed", e);
      throw e;
    });
    const out =
      json?.candidates?.[0]?.content?.[0]?.text ||
      json?.output?.[0]?.content?.text ||
      JSON.stringify(json);
    const start = out.indexOf("[");
    const end = out.lastIndexOf("]");
    if (start === -1 || end === -1) {
      console.error("Gemini response missing JSON array", { out, json });
      throw new Error("No JSON array found");
    }
    return JSON.parse(out.substring(start, end + 1));
  } catch (err) {
    console.error("callGemini failed", err);
    throw err;
  }
};

/**
 * extractClasses
 *
 * Given a base64-encoded photo of a student schedule, return an array of
 * class objects with fields: name, teacher, period, emoji and type.
 *
 * This function chooses the configured AI provider (anthropic by default)
 * and delegates to the appropriate low-level call function.
 *
 * @param base64 - Base64-encoded image data
 * @returns Promise resolving to parsed class array
 */
export const extractClasses = async (base64: string) => {
  const prompt = `Format: [{"name":"Class Name","teacher":"Teacher Name","period":"3rd","emoji":"📚","type":"class"}]\nUse type 'class' or 'club' as appropriate.`;
  try {
    console.log("DEBUG: extractClasses calling provider", AI_PROVIDER);
    if (AI_PROVIDER === "gemini") {
      try {
        return await callGemini(base64, prompt);
      } catch (e) {
        console.error(
          "extractClasses: Gemini failed, attempting Anthropic fallback",
          e,
        );
        if (ANTHROPIC_KEY) return await callAnthropic(base64, prompt);
        throw e;
      }
    }
    return await callAnthropic(base64, prompt);
  } catch (err) {
    console.error("extractClasses failed", err);
    throw err;
  }
};

/**
 * extractTimes
 *
 * Given a base64-encoded photo of bell times, returns an array of period
 * objects with start/end times in 24-hour-ish HH:MM format (string).
 *
 * @param base64 - Base64-encoded image data
 * @returns Promise resolving to parsed times array
 */
export const extractTimes = async (base64: string) => {
  const prompt = `Format: [{"period":"1st","startTime":"08:40","endTime":"09:30"}]\nReturn only a JSON array.`;
  try {
    console.log("DEBUG: extractTimes calling provider", AI_PROVIDER);
    if (AI_PROVIDER === "gemini") {
      try {
        return await callGemini(base64, prompt);
      } catch (e) {
        console.error(
          "extractTimes: Gemini failed, attempting Anthropic fallback",
          e,
        );
        if (ANTHROPIC_KEY) return await callAnthropic(base64, prompt);
        throw e;
      }
    }
    return await callAnthropic(base64, prompt);
  } catch (err) {
    console.error("extractTimes failed", err);
    throw err;
  }
};

export default {
  extractClasses,
  extractTimes,
};
