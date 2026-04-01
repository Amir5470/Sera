import { doc, setDoc } from 'firebase/firestore'
import { Profile } from '../hooks/useProfile'
import { db } from './firebase'

export const saveProfile = async (uid: string, schoolId: string, data: Partial<Profile>) => {
  // Save to school subcollection
  await setDoc(doc(db, 'schools', schoolId, 'users', uid), { ...data, uid }, { merge: true })
  // Save minimal ref at top level for auth lookup
  await setDoc(doc(db, 'userIndex', uid), { schoolId, uid }, { merge: true })
}

export const saveProfileIndex = async (uid: string, data: Partial<Profile>) => {

  await setDoc(doc(db, 'userIndex', uid), { ...data, uid }, { merge: true })
}

export const completeOnboarding = async (uid: string, schoolId: string) => {

  await setDoc(doc(db, 'schools', schoolId, 'users', uid), { onboardingComplete: true }, { merge: true })
  await setDoc(doc(db, 'userIndex', uid), { onboardingComplete: true }, { merge: true })
}