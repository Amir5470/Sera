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

export const useFeed = (schoolId: string | undefined) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(
      collection(db, "schools", schoolId, "posts"),
      orderBy("createdAt", "desc"),
    );
    const unsub = safeOnSnapshot(
      q,
      (snap) => {
        setPosts(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Post),
        );
        setLoading(false);
      },
      (err) => {
        setPosts([]);
        setLoading(false);
      },
    );
    return unsub;
  }, [schoolId]);

  return { posts, loading };
};
