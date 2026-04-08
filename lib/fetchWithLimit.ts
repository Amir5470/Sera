import { checkAndRecordAttempt } from "./rateLimiter";

function hostFromUrl(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export async function fetchWithLimit(
  url: string,
  opts?: RequestInit,
  maxPerWindow = 500,
  windowMs = 15 * 60 * 1000,
) {
  const host = hostFromUrl(url);
  const allowed = await checkAndRecordAttempt(
    `fetch:${host}`,
    maxPerWindow,
    windowMs,
  );
  if (!allowed) throw new Error("Rate limit exceeded for remote host");
  return fetch(url, opts);
}

export default fetchWithLimit;
