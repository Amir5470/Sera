import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type BellPeriod = {
  period: string;
  startTime: string;
  endTime: string;
};

export type BellSchedule = {
  id: string;
  name: string;
  createdBy: string;
  periods: BellPeriod[];
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Create a new bell schedule template for the school
export const createBellSchedule = async (
  schoolId: string,
  userId: string,
  name: string,
  periods: BellPeriod[],
) => {
  const ref = doc(collection(db, "schools", schoolId, "bellSchedules"));
  await setDoc(ref, {
    name: name.trim(),
    createdBy: userId,
    periods,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Get all bell schedule templates for a school
export const getBellSchedules = async (
  schoolId: string,
): Promise<BellSchedule[]> => {
  const snap = await getDocs(
    collection(db, "schools", schoolId, "bellSchedules"),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BellSchedule);
};

// Vote for today's schedule type
export const voteForSchedule = async (
  schoolId: string,
  userId: string,
  scheduleId: string,
) => {
  const today = todayKey();
  const ref = doc(db, "schools", schoolId, "dailySchedule", "current");
  const snap = await getDoc(ref);

  let votes: Record<string, string> = {};
  if (snap.exists()) {
    const data = snap.data();
    if (data.date === today) {
      votes = { ...data.votes, [userId]: scheduleId };
    } else {
      // New day: reset the map with just the current user's vote
      votes = { [userId]: scheduleId };
    }
  } else {
    votes = { [userId]: scheduleId };
  }

  // Tally votes — simple majority (most votes wins)
  const tally: Record<string, number> = {};
  for (const sid of Object.values(votes) as string[]) {
    tally[sid] = (tally[sid] || 0) + 1;
  }
  const activeScheduleId = Object.entries(tally).sort(
    (a, b) => b[1] - a[1],
  )[0][0];

  await setDoc(ref, {
    votes,
    activeScheduleId,
    date: today,
    updatedAt: serverTimestamp(),
  });
  return activeScheduleId;
};

// Get today's active schedule ID and vote map
export const getDailySchedule = async (schoolId: string) => {
  const today = todayKey();
  const snap = await getDoc(
    doc(db, "schools", schoolId, "dailySchedule", "current"),
  );
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.date !== today) return null;
  return data as {
    votes: Record<string, string>;
    activeScheduleId: string;
  };
};

// Set the school's default bell schedule (used when there is no daily override).
export const setDefaultBellSchedule = async (
  schoolId: string,
  scheduleId: string,
) => {
  const ref = doc(db, "schools", schoolId, "dailySchedule", "default");
  await setDoc(ref, {
    defaultScheduleId: scheduleId,
    updatedAt: serverTimestamp(),
  });
  return scheduleId;
};
