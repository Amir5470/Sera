import { collection, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import safeOnSnapshot from "../lib/firestoreHelpers";

export type Club = {
  id: string;
  name: string;
  teacher: string;
  period: string;
  emoji: string;
  startTime: string;
  endTime: string;
};

export const useClubs = (
  schoolId: string | undefined,
  userId: string | undefined,
) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !userId) {
      setLoading(false);
      return;
    }

    const q = collection(db, "schools", schoolId, "clubs");

    const unsub = safeOnSnapshot(
      q,
      async (snap) => {
        const memberChecks = snap.docs.map(async (d: any) => {
          const memberRef = doc(
            db,
            "schools",
            schoolId,
            "clubs",
            d.id,
            "members",
            userId,
          );
          const memberSnap = await getDoc(memberRef);

          if (!memberSnap.exists()) return null;

          // All data lives on the club doc now, same as classes
          const clubData = d.data();
          return {
            id: d.id,
            name: clubData.name,
            teacher: clubData.teacher,
            period: clubData.period,
            emoji: clubData.emoji || "🤝",
            startTime: clubData.startTime || "",
            endTime: clubData.endTime || "",
          } as Club;
        });

        const results = await Promise.all(memberChecks);
        setClubs(results.filter(Boolean) as Club[]);
        setLoading(false);
      },
      (err) => {
        console.error("useClubs snapshot error:", err);
        setClubs([]);
        setLoading(false);
      },
    );

    return unsub;
  }, [schoolId, userId]);

  return { clubs, loading };
};
