import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const getKey = (name: string) => `rate_limiter:${name}`;

async function readTimestamps(key: string): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

async function writeTimestamps(key: string, stamps: number[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(stamps));
  } catch {
    // ignore storage errors
  }
}

export async function checkAndRecordAttempt(
  name: string,
  maxAttempts = 5,
  windowMs = DEFAULT_WINDOW_MS,
): Promise<boolean> {
  const key = getKey(name);
  const now = Date.now();
  const cutoff = now - windowMs;
  const stamps = (await readTimestamps(key)).filter((s) => s > cutoff);
  if (stamps.length >= maxAttempts) return false;
  stamps.push(now);
  await writeTimestamps(key, stamps);
  return true;
}

export async function resetAttempts(name: string) {
  const key = getKey(name);
  await AsyncStorage.removeItem(key);
}

export async function getAttemptCount(
  name: string,
  windowMs = DEFAULT_WINDOW_MS,
) {
  const key = getKey(name);
  const now = Date.now();
  const cutoff = now - windowMs;
  const stamps = (await readTimestamps(key)).filter((s) => s > cutoff);
  return stamps.length;
}

export default { checkAndRecordAttempt, resetAttempts, getAttemptCount };
