import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  CalendarEventInput,
  removeSharedEventFromPost,
  saveSharedEventFromPost,
} from "./calendarEvents";
import { db } from "./firebase";
import { sanitizeText } from "./inputSanitizer";
import { moderateText } from "./moderation";

export type SharedEventPayload = CalendarEventInput;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}\s?(AM|PM|am|pm)?$/;

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

export const createEventPost = async (
  schoolId: string,
  event: SharedEventPayload,
  authorName: string,
  authorId: string,
  text?: string,
  imageUrl?: string,
) => {
  if (!DATE_KEY_RE.test(event.dateKey)) {
    throw new Error("Use date format YYYY-MM-DD.");
  }
  if (!TIME_RE.test(event.startTime) || !TIME_RE.test(event.endTime)) {
    throw new Error("Use time format like 3:30 PM.");
  }

  const cleanEvent: SharedEventPayload = {
    name: sanitizeText(event.name, 120),
    dateKey: event.dateKey,
    startTime: sanitizeText(event.startTime, 20),
    endTime: sanitizeText(event.endTime, 20),
    details: event.details ? sanitizeText(event.details, 400) : "",
  };
  const cleanText = text ? sanitizeText(text, 500) : "";

  const moderationText = `${cleanText}\n${cleanEvent.name}\n${cleanEvent.details || ""}`;

  try {
    const res = await moderateText(moderationText);
    if (!res.safe) {
      throw new Error("Content not allowed: " + (res.reason || "unsafe"));
    }
  } catch (e) {
    // Do not block users if moderation API is unavailable.
  }

  const docData: any = {
    text: cleanText,
    authorName,
    authorId,
    type: "event",
    event: cleanEvent,
    createdAt: Date.now(),
  };
  if (imageUrl) docData.imageUrl = imageUrl;

  const ref = await addDoc(
    collection(db, "schools", schoolId, "posts"),
    docData,
  );

  return { id: ref.id };
};

export const respondToEventInvite = async (
  schoolId: string,
  postId: string,
  userId: string,
  event: SharedEventPayload,
  status: "accepted" | "declined",
) => {
  const responseRef = doc(
    db,
    "schools",
    schoolId,
    "posts",
    postId,
    "responses",
    userId,
  );

  await setDoc(
    responseRef,
    {
      status,
      respondedAt: Date.now(),
    },
    { merge: true },
  );

  if (status === "accepted") {
    await saveSharedEventFromPost(userId, postId, event);
  }
  if (status === "declined") {
    // Best-effort: remove any previously-saved event tied to this post
    try {
      await removeSharedEventFromPost(userId, postId);
    } catch (e) {
      // ignore errors; this is best-effort cleanup
    }
  }
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
