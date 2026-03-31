import { addDoc, collection } from 'firebase/firestore'
import { db } from './firebase'

export const createPost = async (text: string, authorName: string, authorId: string) => {
  await addDoc(collection(db, 'posts'), {
    text,
    authorName,
    authorId,
    createdAt: Date.now(),
  })
}