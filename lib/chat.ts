import { addDoc, collection } from 'firebase/firestore'
import { db } from './firebase'

export const sendMessage = async (
  classRoomId: string,
  text: string,
  authorName: string,
  authorId: string
) => {
  await addDoc(collection(db, 'classRooms', classRoomId, 'messages'), {
    text,
    authorName,
    authorId,
    createdAt: Date.now(),
  })
}