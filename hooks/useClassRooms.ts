import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'

export type ClassRoom = {
  id: string
  name: string
  teacher: string
  period: string
  classRoomId: string
}

export const useClassRooms = () => {
  const { user } = useAuth()
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'classes'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      setClassRooms(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassRoom)))
      setLoading(false)
    })
    return unsub
  }, [user])

  return { classRooms, loading }
}