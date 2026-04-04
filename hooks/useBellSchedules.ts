import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { BellSchedule } from "../lib/bellSchedules";
import { db } from "../lib/firebase";

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const useBellSchedules = (schoolId: string | undefined) => {
  const [schedules, setSchedules] = useState<BellSchedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Listen to bell schedule templates
  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      collection(db, "schools", schoolId, "bellSchedules"),
      (snap) => {
        setSchedules(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BellSchedule),
        );
        setLoading(false);
      },
    );
    return unsub;
  }, [schoolId]);

  // Listen to today's vote doc
  useEffect(() => {
    if (!schoolId) return;

    const key = todayKey();
    const unsub = onSnapshot(
      doc(db, "schools", schoolId, "dailySchedule", key),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setActiveScheduleId(data.activeScheduleId || null);
          setVotes(data.votes || {});
        } else {
          setActiveScheduleId(null);
          setVotes({});
        }
      },
    );
    return unsub;
  }, [schoolId]);

  const activeSchedule =
    schedules.find((s) => s.id === activeScheduleId) ?? null;

  // Vote count per schedule
  const voteCounts: Record<string, number> = {};
  for (const sid of Object.values(votes)) {
    voteCounts[sid] = (voteCounts[sid] || 0) + 1;
  }

  return {
    schedules,
    activeSchedule,
    activeScheduleId,
    votes,
    voteCounts,
    loading,
  };
};
