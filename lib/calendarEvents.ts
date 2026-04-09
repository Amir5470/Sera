import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { sanitizeText } from "./inputSanitizer";

export type CalendarEventInput = {
  name: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  details?: string;
};

export type CalendarEvent = {
  id: string;
  name: string;
  dateKey: string;
  dateMs: number;
  startTime: string;
  endTime: string;
  details: string;
  sourcePostId?: string;
  createdAt: number;
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}\s?(AM|PM|am|pm)?$/;

const parseDateKeyToMs = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};

const validateInput = (input: CalendarEventInput) => {
  if (!DATE_KEY_RE.test(input.dateKey)) {
    throw new Error("Invalid date.");
  }

  if (!TIME_RE.test(input.startTime) || !TIME_RE.test(input.endTime)) {
    throw new Error("Use time format like 3:30 PM.");
  }

  return {
    name: sanitizeText(input.name, 120),
    dateKey: input.dateKey,
    startTime: sanitizeText(input.startTime, 20),
    endTime: sanitizeText(input.endTime, 20),
    details: input.details ? sanitizeText(input.details, 400) : "",
    dateMs: parseDateKeyToMs(input.dateKey),
  };
};

export const createPersonalEvent = async (
  userId: string,
  input: CalendarEventInput,
) => {
  const clean = validateInput(input);
  const ref = await addDoc(
    collection(db, "userIndex", userId, "calendarEvents"),
    {
      ...clean,
      createdAt: Date.now(),
    },
  );
  return ref.id;
};

export const saveSharedEventFromPost = async (
  userId: string,
  postId: string,
  input: CalendarEventInput,
) => {
  const clean = validateInput(input);
  const eventRef = doc(db, "userIndex", userId, "calendarEvents", postId);
  const existing = await getDoc(eventRef);

  if (existing.exists()) {
    return existing.id;
  }

  await setDoc(eventRef, {
    ...clean,
    sourcePostId: postId,
    createdAt: Date.now(),
  });

  return postId;
};

export const removeSharedEventFromPost = async (
  userId: string,
  postId: string,
) => {
  const eventRef = doc(db, "userIndex", userId, "calendarEvents", postId);
  const existing = await getDoc(eventRef);
  if (!existing.exists()) return false;
  await deleteDoc(eventRef);
  return true;
};
