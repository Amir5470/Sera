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

    const unsub = onSnapshot(
      doc(db, "schools", schoolId, "dailySchedule", "current"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const isToday = data.date === todayKey();
          // Only show data if it matches today's date
          setActiveScheduleId(isToday ? data.activeScheduleId || null : null);
          setVotes(isToday ? data.votes || {} : {});
        } else {
          setActiveScheduleId(null);
          setVotes({});
        }
      },
    );
    return unsub;
  }, [schoolId]);

  // Listen to school's default schedule selection (if set)
  const [defaultScheduleId, setDefaultScheduleId] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!schoolId) return;
    const unsub = onSnapshot(
      doc(db, "schools", schoolId, "dailySchedule", "default"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDefaultScheduleId(data.defaultScheduleId || null);
        } else {
          setDefaultScheduleId(null);
        }
      },
    );
    return unsub;
  }, [schoolId]);

  const activeSchedule =
    schedules.find((s) => s.id === activeScheduleId) ?? null;

  // Default schedule: prefer explicit default set by school admin, otherwise
  // prefer a template named 'Regular' (case-insensitive), otherwise fall
  // back to the first template if available. This is used by screens
  // (calendar/schedule) as the baseline schedule for days that have not
  // been overridden by a daily vote/override document.
  const defaultSchedule =
    (defaultScheduleId && schedules.find((s) => s.id === defaultScheduleId)) ??
    schedules.find((s) => /^regular/i.test(s.name)) ??
    schedules[0] ??
    null;

  // Vote count per schedule
  const voteCounts: Record<string, number> = {};
  for (const sid of Object.values(votes)) {
    voteCounts[sid] = (voteCounts[sid] || 0) + 1;
  }

  return {
    schedules,
    activeSchedule,
    defaultSchedule,
    defaultScheduleId,
    activeScheduleId,
    votes,
    voteCounts,
    loading,
  };
};
