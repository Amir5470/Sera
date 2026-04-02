import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'

export type ClassRoom = {
  id: string
  name: string
  teacher: string
  period?: string
  emoji?: string
  startTime?: string
  endTime?: string
  type?: 'class' | 'club'
}

export const useClassRooms = (schoolId: string | undefined, userId: string | undefined) => {
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId || !userId) {
      setLoading(false)
      return
    }

    // This listener is the "Source of Truth"
    // We listen to the specific school's classes
    const classesRef = collection(db, 'schools', schoolId, 'classes')

    const unsub = onSnapshot(classesRef, async (snapshot) => {
      const joined: ClassRoom[] = []

      // Map through every class in the school and check if this specific user is a member
      const promises = snapshot.docs.map(async (classDoc) => {
        const memberRef = doc(db, 'schools', schoolId, 'classes', classDoc.id, 'members', userId)
        const memberSnap = await getDoc(memberRef)

        if (memberSnap.exists()) {
          const mData = memberSnap.data()
          const cData = classDoc.data()

          joined.push({
            id: classDoc.id,
            name: cData.name,
            teacher: cData.teacher,
            period: mData.period,
            emoji: mData.emoji,
            startTime: mData.startTime,
            endTime: mData.endTime,
          })
        }
      })

      await Promise.all(promises)

      setClassRooms(joined)
      setLoading(false)
    })

    return unsub
  }, [schoolId, userId])

  return { classRooms, loading }
}