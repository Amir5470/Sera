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
  console.log("DEBUG: joinOrCreateClass start", {
    userId,
    schoolId,
    classData,
  });

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
    console.log("DEBUG: joinOrCreateClass ensured userIndex", {
      userId,
      schoolId,
    });
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
  console.log("DEBUG: joinOrCreateClass query snap size", snap.size);

  let roomId: string;

  if (!snap.empty) {
    roomId = snap.docs[0].id;
    console.log("DEBUG: joinOrCreateClass found existing room", { roomId });
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
    console.log("DEBUG: joinOrCreateClass created room", { roomId });
  }

  // Member doc only tracks membership — no schedule data here
  try {
    await setDoc(
      doc(db, "schools", schoolId, col, roomId, "members", userId),
      { joinedAt: Date.now() },
      { merge: true },
    );
    console.log("DEBUG: joinOrCreateClass wrote member doc", {
      roomId,
      userId,
    });
  } catch (e) {
    console.error("DEBUG: joinOrCreateClass failed to write member doc", {
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
    console.log("DEBUG: joinOrCreateClass updated school user index", {
      userId,
      roomId,
    });
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
    console.log("DEBUG: leaveClass deleted member doc", { classId, userId });
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
    console.log("DEBUG: leaveClass removed classId from user index", {
      userId,
      classId,
    });
  } catch (e) {
    console.warn("Could not remove classId from user index", e);
  }
};
