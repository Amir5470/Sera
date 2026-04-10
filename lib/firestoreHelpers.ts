import { DocumentReference, onSnapshot, Query } from "firebase/firestore";

type Unsubscribe = () => void;

// Wrap Firestore onSnapshot to always register an error handler so errors
// (like permission-denied) are logged and won't crash the app's HMR console.
export const safeOnSnapshot = (
  ref: Query | DocumentReference,
  next: (snap: any) => void,
  onError?: (err: Error) => void,
): Unsubscribe => {
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
      console.error("Firestore snapshot error:", err);
      if (onError) onError(err as Error);
    },
  );
  return unsub;
};

export default safeOnSnapshot;
