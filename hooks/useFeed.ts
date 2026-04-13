import { collection, doc, getDoc, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import safeOnSnapshot from "../lib/firestoreHelpers";
import { SharedEventPayload } from "../lib/posts";

export type Post = {
  id: string;
  text: string;
  authorName: string;
  authorId: string;
  type?: "text" | "event";
  event?: SharedEventPayload;
  imageUrl?: string;
  createdAt: number;
};

/**
 * useFeed
 *
 * Subscribes to the school's posts collection and returns a list of posts
 * sorted newest-first along with a loading flag.
 *
 * @param schoolId - The current school's document id. When undefined, the hook
 *   returns an empty list and does not subscribe.
 * @returns { posts: Post[], loading: boolean }
 */
export const useFeed = (schoolId: string | undefined) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      // No school selected: don't subscribe and expose an explicit non-loading empty state.
      setPosts([]);
      setLoading(false);
      return;
    }

    // Guard: ensure the authenticated user's userIndex actually lists this schoolId
    // before creating a long-lived snapshot subscription. This avoids permission
    // denied snapshot churn when the server-side index is not yet visible.
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      console.warn(
        "useFeed: no authenticated user; skipping posts subscription",
      );
      setPosts([]);
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    (async () => {
      try {
        const uiRef = doc(db, "userIndex", currentUid);
        const uiSnap = await getDoc(uiRef);
        const userSchool = uiSnap.exists()
          ? (uiSnap.data() as any).schoolId
          : undefined;
        if (userSchool !== schoolId) {
          console.warn(
            `useFeed: userIndex.schoolId mismatch or not yet present (have=${userSchool} want=${schoolId}); skipping subscription`,
          );
          setPosts([]);
          setLoading(false);
          return;
        }

        // Proceed to subscribe once the pre-check passes
        const q = query(
          collection(db, "schools", schoolId, "posts"),
          orderBy("createdAt", "desc"),
        );
        unsub = safeOnSnapshot(
          q,
          (snap) => {
            setPosts(
              snap.docs.map(
                (doc: any) => ({ id: doc.id, ...doc.data() }) as Post,
              ),
            );
            setLoading(false);
          },
          (err) => {
            setPosts([]);
            setLoading(false);
          },
          `useFeed posts for school ${schoolId}`,
        );
      } catch (e) {
        console.error("useFeed pre-check failed:", e);
        setPosts([]);
        setLoading(false);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [schoolId]);

  return { posts, loading };
};
