import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

export type ClassData = {
  name: string
  teacher: string
  period: string
  type?: 'class' | 'club'
  emoji?: string
  startTime?: string
  endTime?: string
}

export const joinOrCreateClass = async (
  userId: string,
  schoolId: string,
  classData: ClassData
) => {
  const isClub = classData.type === 'club'
  const rootCol = isClub
    ? collection(db, 'schools', schoolId, 'clubs')
    : collection(db, 'schools', schoolId, 'classes')

  const q = query(rootCol, where('nameLower', '==', classData.name.toLowerCase().trim()))
  const snap = await getDocs(q)

  let roomId: string

  if (!snap.empty) {
    roomId = snap.docs[0].id
  } else {
    const ref = await addDoc(rootCol, {
      name: classData.name.trim(),
      nameLower: classData.name.toLowerCase().trim(),
      teacher: classData.teacher,
      createdAt: Date.now(),
    })
    roomId = ref.id
  }

  await setDoc(
    doc(db, 'schools', schoolId, isClub ? 'clubs' : 'classes', roomId, 'members', userId),
    {
      joinedAt: Date.now(),
      period: classData.period,
      emoji: classData.emoji || '📖',
      startTime: classData.startTime || '',
      endTime: classData.endTime || '',
    },
    { merge: true }
  )

  return roomId
}

export const leaveClass = async (
  userId: string,
  schoolId: string,
  classId: string,
  isClub: boolean = false
) => {
  const col = isClub ? 'clubs' : 'classes'
  const memberRef = doc(db, 'schools', schoolId, col, classId, 'members', userId)
  await deleteDoc(memberRef)

  // Check if any members remain
  const membersCol = collection(db, 'schools', schoolId, col, classId, 'members')
  const countSnap = await getCountFromServer(membersCol)

  if (countSnap.data().count === 0) {
    // No members left — delete the class/club room entirely
    await deleteDoc(doc(db, 'schools', schoolId, col, classId))
    console.log(`Deleted empty ${col} room: ${classId}`)
  }
}