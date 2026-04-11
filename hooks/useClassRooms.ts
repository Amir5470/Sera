import { collection, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import safeOnSnapshot from "../lib/firestoreHelpers";

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

  useEffect(() => {
    if (!schoolId || !userId) {
      setLoading(false);
      return;
    }

    const classesRef = collection(db, "schools", schoolId, "classes");

    const unsub = safeOnSnapshot(
      classesRef,
      async (snapshot) => {
        const promises = snapshot.docs.map(async (classDoc: any) => {
          const memberRef = doc(
            db,
            "schools",
            schoolId,
            "classes",
            classDoc.id,
            "members",
            userId,
          );
          const memberSnap = await getDoc(memberRef);

          if (!memberSnap.exists()) return null;

          // All schedule data lives on the class doc now
          const cData = classDoc.data();
          return {
            id: classDoc.id,
            name: cData.name,
            teacher: cData.teacher,
            period: cData.period,
            emoji: cData.emoji || "📖",
            startTime: cData.startTime || "",
            endTime: cData.endTime || "",
          } as ClassRoom;
        });

        const results = await Promise.all(promises);
        setClassRooms(results.filter(Boolean) as ClassRoom[]);
        setLoading(false);
      },
      (err) => {
        console.error("useClassRooms snapshot error:", err);
        setClassRooms([]);
        setLoading(false);
      },
    );

    return unsub;
  }, [schoolId, userId]);

  return { classRooms, loading };
};
