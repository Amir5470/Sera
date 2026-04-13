import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import safeOnSnapshot from "../lib/firestoreHelpers";
import { useAuth } from "./useAuth";

export type Profile = {
  uid: string;
  displayName: string;
  username: string;
  grade: string;
  school: string;
  city: string;
  schoolId: string;
  sports: string[];
  interests: string[];
  notifications: string[];
  heardFrom: string;
  photoURL?: string;
  onboardingComplete: boolean;
};

/**
 * useProfile
 *
 * React hook that subscribes to the user's global `userIndex/{uid}` document
 * and returns the typed profile object along with a loading flag.
 *
 * Behavior notes:
 * - Returns `profile = null` when no user is signed in or if the document does
 *   not exist.
 * - Catches permission errors via safeOnSnapshot's onError and sets profile
 *   to null to avoid throwing in the UI.
 *
 * @returns { profile: Profile | null, loading: boolean }
 */
export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;
    let mounted = true;

    (async () => {
      try {
        // First, try the canonical global userIndex doc
        const uiSnap = await getDoc(doc(db, "userIndex", user.uid));
        if (uiSnap.exists()) {
          // Subscribe to userIndex for realtime updates
          unsub = safeOnSnapshot(
            doc(db, "userIndex", user.uid),
            (snap) => {
              if (!mounted) return;
              setProfile(snap.exists() ? (snap.data() as Profile) : null);
              setLoading(false);
            },
            (err) => {
              if (!mounted) return;
              setProfile(null);
              setLoading(false);
            },
            `useProfile userIndex ${user.uid}`,
          );
          return;
        }

        // Fallback: some legacy/new accounts saved profile under
        // schools/{schoolId}/users/{uid}. Query collectionGroup 'users'
        // for a matching uid and subscribe to the first match.
        const q = query(
          collectionGroup(db, "users"),
          where("uid", "==", user.uid),
        );
        const found = await getDocs(q);
        if (!found.empty) {
          const schoolUserRef = found.docs[0].ref;
          // Infer schoolId from the document path: schools/{schoolId}/users/{uid}
          const parts = schoolUserRef.path.split("/");
          const inferredSchoolId = parts.length >= 2 ? parts[1] : undefined;
          unsub = safeOnSnapshot(
            schoolUserRef,
            (snap) => {
              if (!mounted) return;
              if (!snap.exists()) {
                setProfile(null);
                setLoading(false);
                return;
              }
              const data = snap.data() as Profile;
              // Ensure callers see `schoolId` even if the per-school doc omits it
              const withSchool: Profile = {
                ...data,
                schoolId: (data as any).schoolId || inferredSchoolId || "",
              } as Profile;
              setProfile(withSchool);
              setLoading(false);
            },
            (err) => {
              if (!mounted) return;
              setProfile(null);
              setLoading(false);
            },
            `useProfile schoolUser ${schoolUserRef.path}`,
          );
          return;
        }

        // Nothing found — still listen for a future creation of userIndex
        unsub = safeOnSnapshot(
          doc(db, "userIndex", user.uid),
          (snap) => {
            if (!mounted) return;
            setProfile(snap.exists() ? (snap.data() as Profile) : null);
            setLoading(false);
          },
          (err) => {
            if (!mounted) return;
            setProfile(null);
            setLoading(false);
          },
          `useProfile userIndex ${user.uid} (watching for creation)`,
        );
      } catch (e) {
        console.error("useProfile lookup failed", e);
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [user?.uid]);
  return { profile, loading };
};
