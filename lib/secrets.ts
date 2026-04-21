const WORKER_URL =
  process.env.EXPO_PUBLIC_SECRETS_WORKER_URL ||
  "https://sera-secrets-worker.amirmechkour5474.workers.dev";

let _cache = null;

export async function fetchPublicConfig(force = false) {
  if (_cache && !force) return _cache;
  try {
    const res = await fetch(`${WORKER_URL.replace(/\/+$/, "")}/public-config`);
    if (!res.ok) throw new Error(`public-config failed: ${res.status}`);
    const json = await res.json();
    _cache = json;
    return json;
  } catch (e) {
    console.error("fetchPublicConfig error", e);
    throw e;
  }
}

export async function getSecret(name) {
  const cfg = await fetchPublicConfig();
  return cfg ? cfg[name] : undefined;
}

export default { fetchPublicConfig, getSecret };
