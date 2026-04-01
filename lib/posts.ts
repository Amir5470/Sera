import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

export const createPost = async (
  schoolId: string,
  text: string,
  authorName: string,
  authorId: string
) => {
  await addDoc(collection(db, 'schools', schoolId, 'posts'), {
    text,
    authorName,
    authorId,
    type: 'text',
    createdAt: Date.now(),
  })
}

export const deletePost = async (schoolId: string, postId: string) => {
  await deleteDoc(doc(db, 'schools', schoolId, 'posts', postId))
}

export const addReply = async (
  schoolId: string,
  postId: string,
  text: string,
  authorName: string,
  authorId: string
) => {
  await addDoc(collection(db, 'schools', schoolId, 'posts', postId, 'reactions'), {
    text,
    authorName,
    authorId,
    type: 'text',
    createdAt: Date.now(),
  })
}