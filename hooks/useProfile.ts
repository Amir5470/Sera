import { doc } from "firebase/firestore";
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

    const ref = doc(db, "userIndex", user.uid);
    const unsub = safeOnSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as Profile) : null);
        setLoading(false);
      },
      (err) => {
        // permission errors are surfaced here; keep profile null and stop loading
        setProfile(null);
        setLoading(false);
      },
      `useProfile userIndex ${user.uid}`,
    );

    return unsub;
  }, [user?.uid]);
  return { profile, loading };
};
