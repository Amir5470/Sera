import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { Profile } from '../hooks/useProfile'
import { db } from './firebase'

export const saveProfile = async (uid: string, data: Partial<Profile>) => {
  await setDoc(doc(db, 'users', uid), { ...data, uid }, { merge: true })
}

export const completeOnboarding = async (uid: string) => {
  await updateDoc(doc(db, 'users', uid), { onboardingComplete: true })
}