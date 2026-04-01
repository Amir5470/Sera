import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'

export type Reply = {
  id: string
  text: string
  authorName: string
  authorId: string
  createdAt: number
}

export const useReplies = (schoolId: string | undefined, postId: string) => {
  const [replies, setReplies] = useState<Reply[]>([])

  useEffect(() => {
    if (!schoolId || !postId) return
    const q = query(
      collection(db, 'schools', schoolId, 'posts', postId, 'reactions'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reply)))
    })
    return unsub
  }, [schoolId, postId])

  return { replies }
}