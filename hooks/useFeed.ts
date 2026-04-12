import { collection, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
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
    const q = query(
      collection(db, "schools", schoolId, "posts"),
      orderBy("createdAt", "desc"),
    );
    const unsub = safeOnSnapshot(
      q,
      (snap) => {
        setPosts(
          snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as Post),
        );
        setLoading(false);
      },
      (err) => {
        setPosts([]);
        setLoading(false);
      },
      `useFeed posts for school ${schoolId}`,
    );
    return unsub;
  }, [schoolId]);

  return { posts, loading };
};
