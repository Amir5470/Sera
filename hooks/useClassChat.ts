import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'

export type Message = {
  id: string
  text: string
  authorName: string
  authorId: string
  createdAt: number
}

export const useClassChat = (classRoomId: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classRoomId) return
    const q = query(
      collection(db, 'classRooms', classRoomId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
      setLoading(false)
    })
    return unsub
  }, [classRoomId])

  return { messages, loading }
}