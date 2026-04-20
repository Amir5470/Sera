import cors from "cors";
import express from "express";
import * as functions from "firebase-functions";
import { callProvider } from "./providers";

// Load local .env when not in production (optional for local testing)
if (process.env.NODE_ENV !== "production") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("dotenv").config();
  } catch (e) {
    // ignore
  }
}

// If Firebase functions config is used (firebase functions:config:set),
// map those values into process.env so provider helpers can read them.
try {
  const cfg = functions.config?.();
  if (cfg && cfg.ai) {
    process.env.GEMINI_KEY = process.env.GEMINI_KEY || cfg.ai.gemini_key;
    process.env.ANTHROPIC_KEY =
      process.env.ANTHROPIC_KEY || cfg.ai.anthropic_key;
    process.env.AI_PROVIDER = process.env.AI_PROVIDER || cfg.ai.provider;
    process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || cfg.ai.gemini_model;
    process.env.ANTHROPIC_MODEL =
      process.env.ANTHROPIC_MODEL || cfg.ai.anthropic_model;
  }
} catch (e) {
  // ignore when functions.config is not available
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

async function handleExtract(
  req: express.Request,
  res: express.Response,
  type: "classes" | "times",
) {
  try {
    const { base64 } = req.body || {};
    if (!base64 || typeof base64 !== "string") {
      return res.status(400).json({ error: "Missing required field: base64" });
    }

    // Call configured provider (server-side private keys)
    const parsed = await callProvider(base64, type);

    // Ensure we return clean JSON only
    return res.json(parsed);
  } catch (err: any) {
    console.error("extract error", err?.message || err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

app.post("/extractClasses", async (req, res) =>
  handleExtract(req, res, "classes"),
);
app.post("/extractTimes", async (req, res) => handleExtract(req, res, "times"));

// Export the Express app as a single Cloud Function named `api`.
export const api = functions.region("us-central1").https.onRequest(app);
