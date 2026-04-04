import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type ClassData = {
  name: string;
  teacher: string;
  period: string;
  type?: "class" | "club";
  emoji?: string;
  startTime?: string;
  endTime?: string;
};

export const joinOrCreateClass = async (
  userId: string,
  schoolId: string,
  classData: ClassData,
) => {
  const isClub = classData.type === "club";
  const col = isClub ? "clubs" : "classes";
  const rootCol = collection(db, "schools", schoolId, col);

  // Identity = name + teacher + period (all three must match)
  const nameLower = classData.name.toLowerCase().trim();
  const teacherLower = classData.teacher.toLowerCase().trim();
  const periodLower = classData.period.toLowerCase().trim();

  const q = query(
    rootCol,
    where("nameLower", "==", nameLower),
    where("teacherLower", "==", teacherLower),
    where("periodLower", "==", periodLower),
  );
  const snap = await getDocs(q);

  let roomId: string;

  if (!snap.empty) {
    roomId = snap.docs[0].id;
  } else {
    // Class doesn't exist yet — create it with all data on the class doc
    const ref = await addDoc(rootCol, {
      name: classData.name.trim(),
      nameLower,
      teacher: classData.teacher.trim(),
      teacherLower,
      period: classData.period.trim(),
      periodLower,
      emoji: classData.emoji || "📖",
      startTime: classData.startTime || "",
      endTime: classData.endTime || "",
      createdAt: Date.now(),
    });
    roomId = ref.id;
  }

  // Member doc only tracks membership — no schedule data here
  await setDoc(
    doc(db, "schools", schoolId, col, roomId, "members", userId),
    { joinedAt: Date.now() },
    { merge: true },
  );

  return roomId;
};

export const leaveClass = async (
  userId: string,
  schoolId: string,
  classId: string,
  isClub: boolean = false,
) => {
  const col = isClub ? "clubs" : "classes";
  const memberRef = doc(
    db,
    "schools",
    schoolId,
    col,
    classId,
    "members",
    userId,
  );
  await deleteDoc(memberRef);

  // Delete the room if no members remain
  const membersCol = collection(
    db,
    "schools",
    schoolId,
    col,
    classId,
    "members",
  );
  const countSnap = await getCountFromServer(membersCol);

  if (countSnap.data().count === 0) {
    await deleteDoc(doc(db, "schools", schoolId, col, classId));
    console.log(`Deleted empty ${col} room: ${classId}`);
  }
};
