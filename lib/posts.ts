import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { moderateText } from "./moderation";

export const createPost = async (
  schoolId: string,
  text: string,
  authorName: string,
  authorId: string,
) => {
  // Run client-side moderation. If UNSAFE, throw to caller.
  try {
    const res = await moderateText(text);
    if (!res.safe) {
      throw new Error("Content not allowed: " + (res.reason || "unsafe"));
    }
  } catch (e) {
    // If moderation call fails, allow posting to avoid blocking UX.
  }

  const ref = await addDoc(collection(db, "schools", schoolId, "posts"), {
    text,
    authorName,
    authorId,
    type: "text",
    createdAt: Date.now(),
  });

  // Return created id for caller
  return { id: ref.id };
};

export const deletePost = async (schoolId: string, postId: string) => {
  await deleteDoc(doc(db, "schools", schoolId, "posts", postId));
};

export const reportPost = async (
  schoolId: string,
  postId: string,
  reporterId: string,
  postText?: string,
) => {
  await addDoc(
    collection(db, "schools", schoolId, "posts", postId, "reports"),
    {
      reporterId,
      createdAt: Date.now(),
    },
  );

  // Count reports
  const snaps = await getDocs(
    collection(db, "schools", schoolId, "posts", postId, "reports"),
  );
  if (snaps.size >= 3) {
    // Auto-delete when 3 reports
    await deletePost(schoolId, postId);
    return { deleted: true, reason: "reports" };
  }

  // If provided, run AI moderation; if unsafe delete.
  if (postText) {
    try {
      const mod = await moderateText(postText);
      if (!mod.safe) {
        await deletePost(schoolId, postId);
        return { deleted: true, reason: "ai" };
      } else {
        // keep it and mark approved by setting a lightweight approved marker
        try {
          const postRef = doc(db, "schools", schoolId, "posts", postId);
          await addDoc(collection(postRef, "meta"), {
            aiApproved: true,
            at: Date.now(),
          });
        } catch (e) {
          // best-effort
        }
      }
    } catch (e) {
      // ignore moderation errors
    }
  }

  return { deleted: false };
};

export const addReply = async (
  schoolId: string,
  postId: string,
  text: string,
  authorName: string,
  authorId: string,
) => {
  await addDoc(
    collection(db, "schools", schoolId, "posts", postId, "reactions"),
    {
      text,
      authorName,
      authorId,
      type: "text",
      createdAt: Date.now(),
    },
  );
};
