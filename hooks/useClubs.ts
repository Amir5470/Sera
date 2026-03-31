import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'

export type Club = {
  id: string
  name: string
  teacher: string
  period: string
  clubId: string
}

export const useClubs = () => {
  const { user } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'userClubs'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Club)))
      setLoading(false)
    })
    return unsub
  }, [user])

  return { clubs, loading }
}