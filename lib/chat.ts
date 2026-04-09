import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

export const sendMessage = async (
  schoolId: string,
  roomId: string,
  isClub: boolean,
  text: string,
  authorName: string,
  authorId: string,
  imageUrl?: string,
) => {
  const col = isClub
    ? collection(db, "schools", schoolId, "clubs", roomId, "messages")
    : collection(db, "schools", schoolId, "classes", roomId, "messages");

  const payload: any = {
    text,
    authorName,
    authorId,
    createdAt: Date.now(),
  };
  if (imageUrl) payload.imageUrl = imageUrl;

  await addDoc(col, payload);
};
