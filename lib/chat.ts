import { addDoc, collection } from 'firebase/firestore'
import { db } from './firebase'

export const sendMessage = async (
  schoolId: string,
  roomId: string,
  isClub: boolean,
  text: string,
  authorName: string,
  authorId: string
) => {
  const col = isClub
    ? collection(db, 'schools', schoolId, 'clubs', roomId, 'messages')
    : collection(db, 'schools', schoolId, 'classes', roomId, 'messages')

  await addDoc(col, {
    text,
    authorName,
    authorId,
    createdAt: Date.now(),
  })
}