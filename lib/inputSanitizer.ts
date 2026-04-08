export const DEFAULT_MAX_LENGTH = 2000;

const CONTROL_CHAR_RE = /[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g;
const SCRIPT_TAG_RE = /<\s*script\b/i;
const MULTI_WS_RE = /\s+/g;
const TIME_RE = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;

export function sanitizeText(
  value: unknown,
  maxLength: number = DEFAULT_MAX_LENGTH,
) {
  if (typeof value !== "string") throw new Error("Invalid type");
  let s = value.trim();
  s = s.replace(CONTROL_CHAR_RE, "");
  s = s.replace(MULTI_WS_RE, " ");
  if (!s) throw new Error("Empty value");
  if (SCRIPT_TAG_RE.test(s)) throw new Error("Disallowed content");
  if (s.length > maxLength) throw new Error("Too long");
  return s;
}

export function sanitizeObjectPayload<T extends Record<string, any>>(
  obj: T,
  maxFieldLength = DEFAULT_MAX_LENGTH,
) {
  if (obj == null || typeof obj !== "object")
    throw new Error("Invalid payload");
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out[k] = sanitizeText(v, maxFieldLength);
    else out[k] = v;
  }
  return out as T;
}

export function validateTimeString(t?: string) {
  if (!t) return false;
  const s = String(t).trim();
  return TIME_RE.test(s);
}
