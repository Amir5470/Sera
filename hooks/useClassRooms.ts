import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

export type ClassRoom = {
  id: string;
  name: string;
  teacher: string;
  period: string;
  emoji: string;
  startTime: string;
  endTime: string;
  type?: "class" | "club";
};

/**
 * useClassRooms
 *
 * Subscribes to the school's `classes` collection after performing a
 * membership sanity check on the user's `userIndex/{userId}` document.
 *
 * The hook performs:
 * 1. A one-time getDoc against userIndex/{userId} to confirm the user's
 *    school membership (helps surface permission failures early).
 * 2. A one-time getDocs on the classes collection to obtain an initial
 *    snapshot.
 * 3. A real-time listener (safeOnSnapshot) to keep classRooms up-to-date.
 *
 * @param schoolId - The current school's document id
 * @param userId - The signed-in user's UID
 * @returns { classRooms: ClassRoom[], loading: boolean }
 */
export const useClassRooms = (
  schoolId: string | undefined,
  userId: string | undefined,
) => {
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // inside your useEffect in hooks/useClassRooms.ts
  useEffect(() => {
    if (!userId || !schoolId) return;

    let unsubscribe: (() => void) | undefined;

    const checkMembershipAndSubscribe = async () => {
      try {
        // 1. Manual sanity check before the snapshot fires
        const uiSnap = await getDoc(doc(db, "userIndex", userId));

        console.log("DEBUG: useClassRooms membership check", {
          exists: uiSnap.exists(),
          data: uiSnap.data(),
          expectedSchoolId: schoolId,
          actualSchoolId: uiSnap.data()?.schoolId,
        });

        if (!uiSnap.exists() || uiSnap.data()?.schoolId !== schoolId) {
          console.warn(
            "useClassRooms: Permission would be denied. userIndex missing or mismatch.",
          );
          setClassRooms([]);
          setLoading(false);
          return;
        }

        // 2. Only if the check passes, attempt a one-time read first to ensure
        // rules allow reads; if that succeeds, start the real-time listener.
        const classesRef = collection(db, "schools", schoolId, "classes");
        try {
          const initial = await getDocs(classesRef);
          const roomsInitial = initial.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ClassRoom[];
          setClassRooms(roomsInitial);
          setLoading(false);

          unsubscribe = safeOnSnapshot(
            classesRef,
            (snapshot) => {
              const rooms = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as ClassRoom[];
              setClassRooms(rooms);
              setLoading(false);
            },
            (err) => {
              console.error(
                "useClassRooms snapshot error:",
                err.code,
                err.message,
              );
              setLoading(false);
            },
            `useClassRooms classes for school ${schoolId}`,
          );
        } catch (e: any) {
          console.error(
            "useClassRooms initial getDocs failed:",
            e?.code ?? e,
            e?.message ?? e?.toString(),
          );
          setClassRooms([]);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("useClassRooms logic failed", e);
        setClassRooms([]);
        setLoading(false);
      }
    };

    checkMembershipAndSubscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, schoolId]);

  return { classRooms, loading };
};
