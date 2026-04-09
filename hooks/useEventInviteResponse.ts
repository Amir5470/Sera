import { doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import safeOnSnapshot from "../lib/firestoreHelpers";

export type InviteResponseStatus = "accepted" | "declined" | null;

export const useEventInviteResponse = (
  schoolId: string | undefined,
  postId: string | undefined,
  userId: string | undefined,
) => {
  const [status, setStatus] = useState<InviteResponseStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !postId || !userId) {
      setStatus(null);
      setLoading(false);
      return;
    }

    const responseRef = doc(
      db,
      "schools",
      schoolId,
      "posts",
      postId,
      "responses",
      userId,
    );

    const unsub = safeOnSnapshot(
      responseRef,
      (snap) => {
        if (!snap.exists()) {
          setStatus(null);
        } else {
          const value = snap.data().status;
          setStatus(
            value === "accepted" || value === "declined" ? value : null,
          );
        }
        setLoading(false);
      },
      (err) => {
        console.error("useEventInviteResponse snapshot error:", err);
        setStatus(null);
        setLoading(false);
      },
    );

    return unsub;
  }, [schoolId, postId, userId]);

  return { status, loading };
};
