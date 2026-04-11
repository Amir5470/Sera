import { collection, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { CalendarEvent } from "../lib/calendarEvents";
import { db } from "../lib/firebase";
import safeOnSnapshot from "../lib/firestoreHelpers";

export const useCalendarEvents = (userId: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "userIndex", userId, "calendarEvents"),
      orderBy("dateMs", "asc"),
      orderBy("startTime", "asc"),
    );

    const unsub = safeOnSnapshot(
      q,
      (snap) => {
        setEvents(
          snap.docs.map(
            (doc: any) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as CalendarEvent,
          ),
        );
        setLoading(false);
      },
      (err) => {
        setEvents([]);
        setLoading(false);
      },
    );

    return unsub;
  }, [userId]);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      if (!acc[event.dateKey]) {
        acc[event.dateKey] = [];
      }
      acc[event.dateKey].push(event);
      return acc;
    }, {});
  }, [events]);

  return { events, eventsByDate, loading };
};
