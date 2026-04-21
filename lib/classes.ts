import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  query,
  setDoc,
  updateDoc,
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
  // join or create class utility

  const isClub = classData.type === "club";
  const col = isClub ? "clubs" : "classes";
  const rootCol = collection(db, "schools", schoolId, col);

  // Ensure a minimal userIndex exists so security rules that rely on
  // userIndex/{uid} (belongsToSchool) will allow writes for legacy accounts
  // that only have a per-school users/{uid} doc.
  try {
    await setDoc(doc(db, "userIndex", userId), { uid: userId, schoolId }, {
      merge: true,
    } as any);
    // ensured minimal userIndex for legacy accounts
  } catch (e) {
    console.warn("joinOrCreateClass: could not ensure userIndex", e);
  }

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
  // query to find existing room

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
  try {
    await setDoc(
      doc(db, "schools", schoolId, col, roomId, "members", userId),
      { joinedAt: Date.now() },
      { merge: true },
    );
    // wrote member doc
  } catch (e) {
    console.error("joinOrCreateClass failed to write member doc", {
      roomId,
      userId,
      err: e,
    });
    throw e;
  }

  // Maintain a lightweight index of classIds on the user's school-scoped doc
  try {
    await updateDoc(doc(db, "schools", schoolId, "users", userId), {
      classIds: arrayUnion(roomId),
    } as any);
    // updated school user index (best-effort)
  } catch (e) {
    // Non-fatal: if updating the user doc fails, membership still exists in members/.
    console.warn("Could not update user class index", e);
  }

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

  try {
    await deleteDoc(memberRef);
    // deleted member doc
  } catch (e) {
    console.warn("leaveClass: failed to delete member doc", e);
  }

  // Delete the room if no members remain
  const membersCol = collection(
    db,
    "schools",
    schoolId,
    col,
    classId,
    "members",
  );
  try {
    const countSnap = await getCountFromServer(membersCol);
    if (countSnap.data().count === 0) {
      await deleteDoc(doc(db, "schools", schoolId, col, classId));
      console.log(`Deleted empty ${col} room: ${classId}`);
    }
  } catch (e) {
    console.warn("leaveClass: could not check/delete empty room", e);
  }

  // Remove classId from the user's school-scoped user doc
  try {
    await updateDoc(doc(db, "schools", schoolId, "users", userId), {
      classIds: arrayRemove(classId),
    } as any);
    // removed classId from user index (best-effort)
  } catch (e) {
    console.warn("Could not remove classId from user index", e);
  }
};
