import { DocumentReference, onSnapshot, Query } from "firebase/firestore";

type Unsubscribe = () => void;

/**
 * safeOnSnapshot
 *
 * A lightweight wrapper around Firestore's onSnapshot that ensures an
 * error handler is always registered and any exception thrown inside the
 * `next` callback is caught and logged. This prevents unexpected errors
 * during real-time updates from crashing the app's HMR console during
 * development and surfaces permission errors in a consistent way.
 *
 * @param ref - Query or DocumentReference to listen to
 * @param next - Callback invoked with the snapshot when data changes
 * @param onError - Optional callback invoked on snapshot errors
 * @param label - Optional label to include in error logs for easier tracing
 * @returns Unsubscribe function to stop listening
 */
export const safeOnSnapshot = (
  ref: Query | DocumentReference,
  next: (snap: any) => void,
  onError?: (err: Error) => void,
  label?: string,
): Unsubscribe => {
  const derivePath = () => {
    try {
      const r: any = ref;
      return r.path ?? r._query?.path ?? r.toString?.() ?? "unknown";
    } catch {
      return "unknown";
    }
  };

  const refPath = derivePath();

  const unsub = onSnapshot(
    ref as any,
    (snap: any) => {
      try {
        next(snap);
      } catch (e) {
        console.error("Error processing snapshot callback:", e);
      }
    },
    (err: any) => {
      console.error(
        "Firestore snapshot error:",
        label ? `${label} @ ${refPath}` : refPath,
        err,
      );
      if (onError) onError(err as Error);
    },
  );
  return unsub;
};

export default safeOnSnapshot;
