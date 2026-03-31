import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    setDoc,
    where
} from 'firebase/firestore'
import { db } from './firebase'

export type ClassData = {
  name: string
  teacher: string
  period: string
  type?: 'class' | 'club'
}

export const joinOrCreateClass = async (userId: string, classData: ClassData & { type?: string }) => {
  const isClub = classData.type === 'club'
  const rootCollection = isClub ? 'clubs' : 'classRooms'

  const q = query(
    collection(db, rootCollection),
    where('name', '==', classData.name)
  )
  const snap = await getDocs(q)

  let roomId: string

  if (!snap.empty) {
    roomId = snap.docs[0].id
  } else {
    const ref = await addDoc(collection(db, rootCollection), {
      name: classData.name,
      teacher: classData.teacher,
      createdAt: Date.now(),
    })
    roomId = ref.id
  }

  await addDoc(collection(db, isClub ? 'userClubs' : 'classes'), {
    userId,
    [`${isClub ? 'club' : 'classRoom'}Id`]: roomId,
    name: classData.name,
    teacher: classData.teacher,
    period: classData.period,
    type: classData.type ?? 'class',
    createdAt: Date.now(),
  })

  await setDoc(doc(db, rootCollection, roomId, 'members', userId), {
    joinedAt: Date.now(),
  })

  return roomId
}