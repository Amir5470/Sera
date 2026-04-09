import { collection, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import safeOnSnapshot from "../lib/firestoreHelpers";
import { useAuth } from "./useAuth";

export const useSchedule = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "classes"), where("userId", "==", user.uid));
    const unsub = safeOnSnapshot(
      q,
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("useSchedule snapshot error:", err);
        setClasses([]);
      },
    );
    return unsub;
  }, [user]);

  return { classes };
};
