import { collection, doc, getDoc, getDocs } from "firebase/firestore";
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
    let attempts = 0;

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

          // Filter initial list to only classes where the user is a member.
          const membership = await Promise.all(
            roomsInitial.map(async (r) => {
              try {
                const memberSnap = await getDoc(
                  doc(
                    db,
                    "schools",
                    schoolId,
                    "classes",
                    r.id,
                    "members",
                    userId,
                  ),
                );
                return memberSnap.exists();
              } catch (e) {
                return false;
              }
            }),
          );
          console.log(
            "DEBUG: useClassRooms membership array (initial)",
            membership.map((isMember, i) => ({
              id: roomsInitial[i]?.id,
              name: roomsInitial[i]?.name,
              isMember,
            })),
          );
          const filteredInitial = roomsInitial.filter((_, i) => membership[i]);
          console.log(
            "DEBUG: useClassRooms filteredInitial",
            filteredInitial.length,
            "of",
            roomsInitial.length,
          );
          setClassRooms(filteredInitial);
          setLoading(false);

          unsubscribe = safeOnSnapshot(
            classesRef,
            async (snapshot) => {
              try {
                const rooms = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                })) as ClassRoom[];

                const membershipRealtime = await Promise.all(
                  rooms.map(async (r) => {
                    try {
                      const memberSnap = await getDoc(
                        doc(
                          db,
                          "schools",
                          schoolId,
                          "classes",
                          r.id,
                          "members",
                          userId,
                        ),
                      );
                      return memberSnap.exists();
                    } catch (e) {
                      return false;
                    }
                  }),
                );
                console.log(
                  "DEBUG: useClassRooms membership array (realtime)",
                  membershipRealtime.map((isMember, i) => ({
                    id: rooms[i]?.id,
                    name: rooms[i]?.name,
                    isMember,
                  })),
                );

                const filtered = rooms.filter((_, i) => membershipRealtime[i]);
                console.log(
                  "DEBUG: useClassRooms filteredRealtime",
                  filtered.length,
                  "of",
                  rooms.length,
                );
                setClassRooms(filtered);
                setLoading(false);
              } catch (err) {
                console.error("useClassRooms snapshot processing failed", err);
                setLoading(false);
              }
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
          // If this is a permission race (rules or server-side index not visible yet),
          // retry a few times with backoff before giving up.
          if (
            (e?.code === "permission-denied" ||
              String(e).includes("permission-denied")) &&
            attempts < 3
          ) {
            attempts += 1;
            const delay = 800 * attempts;
            console.warn(
              `useClassRooms: retrying getDocs in ${delay}ms (attempt ${attempts})`,
            );
            setTimeout(checkMembershipAndSubscribe, delay);
            return;
          }
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
