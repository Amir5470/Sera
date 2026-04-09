import { collection, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import safeOnSnapshot from "../lib/firestoreHelpers";

export type Message = {
  id: string;
  text: string;
  authorName: string;
  authorId: string;
  imageUrl?: string;
  createdAt: number;
};

export const useClassChat = (
  schoolId: string | undefined,
  roomId: string | undefined,
  isClub: boolean = false,
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !roomId) return;
    const col = isClub
      ? collection(db, "schools", schoolId, "clubs", roomId, "messages")
      : collection(db, "schools", schoolId, "classes", roomId, "messages");

    const q = query(col, orderBy("createdAt", "asc"));
    const unsub = safeOnSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message),
        );
        setLoading(false);
      },
      (err) => {
        console.error("useClassChat snapshot error:", err);
        setMessages([]);
        setLoading(false);
      },
    );
    return unsub;
  }, [schoolId, roomId, isClub]);

  return { messages, loading };
};
