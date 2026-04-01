import {
    addDoc,
    collection,
    getDocs,
    query,
    where
} from 'firebase/firestore'
import { db } from './firebase'

export type School = {
  id: string
  name: string
  city: string
}

export const searchSchools = async (name: string): Promise<School[]> => {
  if (name.length < 2) return []
  const snap = await getDocs(collection(db, 'schools'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as School))
    .filter(s => s.name.toLowerCase().includes(name.toLowerCase()))
}

export const findOrCreateSchool = async (name: string, city: string): Promise<string> => {
  const q = query(
    collection(db, 'schools'),
    where('nameLower', '==', name.toLowerCase().trim()),
    where('city', '==', city.trim())
  )
  const snap = await getDocs(q)

  if (!snap.empty) return snap.docs[0].id

  const ref = await addDoc(collection(db, 'schools'), {
    name: name.trim(),
    nameLower: name.toLowerCase().trim(),
    city: city.trim(),
    createdAt: Date.now(),
  })

  return ref.id
}

export const getSchoolPath = (schoolId: string) => `schools/${schoolId}`