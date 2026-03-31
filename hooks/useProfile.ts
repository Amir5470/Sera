import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'

export type Profile = {
  uid: string
  displayName: string
  username: string
  grade: string
  school: string
  city: string
  sports: string[]
  interests: string[]
  notifications: string[]
  heardFrom: string
  photoURL?: string
  onboardingComplete: boolean
}

export const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() as Profile : null)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { profile, loading }
}