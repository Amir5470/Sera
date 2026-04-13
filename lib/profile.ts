/**
 * Helpers for saving user profile information to Firestore.
 *
 * Note: These helpers intentionally write the centralized `userIndex/{uid}`
 * document first. Many permission checks and lookups (e.g. belongsToSchool())
 * rely on the presence of userIndex, so write it before writing the
 * school-scoped user document.
 */
import { doc, setDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { Profile } from "../hooks/useProfile";
import { db } from "./firebase";

/**
 * Persist profile fields for a user (legacy, sequential writes).
 *
 * Writes userIndex/{uid} first (with schoolId) and then the per-school
 * document at schools/{schoolId}/users/{uid}.
 */
export const saveProfile = async (
  uid: string,
  schoolId: string,
  data: Partial<Profile>,
) => {
  // CRITICAL: Save userIndex FIRST so belongsToSchool() works
  await setDoc(doc(db, "userIndex", uid), { schoolId, uid }, { merge: true });

  // Then save to school subcollection
  await setDoc(
    doc(db, "schools", schoolId, "users", uid),
    { ...data, uid },
    { merge: true },
  );
};

/**
 * Atomic save: write userIndex/{uid} and schools/{schoolId}/users/{uid}
 * inside a single transaction so we never end up in a partial state.
 *
 * This is the preferred function to call when completing onboarding or
 * when the user selects/changes their school.
 */
export const saveProfileAtomic = async (
  uid: string,
  schoolId: string,
  data: Partial<Profile>,
) => {
  const userIndexRef = doc(db, "userIndex", uid);
  const schoolUserRef = doc(db, "schools", schoolId, "users", uid);

  await runTransaction(db, async (transaction) => {
    // Merge into userIndex with schoolId and any provided fields
    transaction.set(userIndexRef, { ...data, uid, schoolId }, { merge: true } as any);

    // Merge into school users subcollection and record joinedAt if not present
    transaction.set(
      schoolUserRef,
      {
        ...data,
        uid,
        joinedAt: serverTimestamp(),
      },
      { merge: true } as any,
    );
  });
};

/**
 * Update the global userIndex entry for a user with the provided data.
 *
 * Useful when only the userIndex needs updating (searchable fields,
 * onboarding state, username, etc.). This performs a merge update.
 */
export const saveProfileIndex = async (uid: string, data: Partial<Profile>) => {
  await setDoc(doc(db, "userIndex", uid), { ...data, uid }, { merge: true });
};

/**
 * Mark onboarding as complete for the user in both the global userIndex
 * and the per-school users subcollection.
 *
 * This ensures UI routing logic that checks `onboardingComplete` sees the
 * updated value regardless of which document is read.
 */
export const completeOnboarding = async (uid: string, schoolId: string) => {
  // userIndex should already exist by this point, but update it first to be safe
  await setDoc(
    doc(db, "userIndex", uid),
    { onboardingComplete: true },
    { merge: true },
  );
  await setDoc(
    doc(db, "schools", schoolId, "users", uid),
    { uid, onboardingComplete: true },
    { merge: true },
  );
};
