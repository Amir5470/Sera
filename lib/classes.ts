import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
  emoji?: string      // Added
  startTime?: string  // Added
  endTime?: string    // Added
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
    // Create the room if it doesn't exist
    const ref = await addDoc(rootCol, {
      name: classData.name.trim(),
      nameLower: classData.name.toLowerCase().trim(),
      teacher: classData.teacher || 'Unknown',
      createdAt: Date.now(),
    })
    roomId = ref.id
  }

  // SAVE USER-SPECIFIC DATA (Emoji and Times)
  // This ensures your useClassRooms hook can actually find the data you reviewed
  await setDoc(
    doc(db, 'schools', schoolId, isClub ? 'clubs' : 'classes', roomId, 'members', userId),
    { 
      joinedAt: Date.now(), 
      period: classData.period,
      emoji: classData.emoji || '📖',
      startTime: classData.startTime || '',
      endTime: classData.endTime || ''
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
  try {
    const col = isClub ? 'clubs' : 'classes'
    const docRef = doc(db, 'schools', schoolId, col, classId, 'members', userId);
    
    // Perform the deletion
    await deleteDoc(docRef);
    
    console.log(`Successfully removed member ${userId} from ${col}/${classId}`);
  } catch (error) {
    console.error("Error in leaveClass:", error);
    throw error;
  }
}