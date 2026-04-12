import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
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

        // 2. Only if the check passes, start the real-time listener
        const classesRef = collection(db, "schools", schoolId, "classes");
        unsubscribe = onSnapshot(
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
        );
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
