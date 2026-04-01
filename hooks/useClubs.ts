import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'

export type Club = {
  id: string
  name: string
  teacher: string
  emoji?: string // Added to match your new schedule style
}

export const useClubs = (schoolId: string | undefined, userId: string | undefined) => {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId || !userId) {
      setLoading(false)
      return
    }

    // Listen to the school's clubs collection
    const q = collection(db, 'schools', schoolId, 'clubs')
    
    const unsub = onSnapshot(q, async (snap) => {
      const joined: Club[] = []
      
      // Use Promise.all to check all memberships in parallel
      // This makes the UI feel much faster and more responsive
      const memberChecks = snap.docs.map(async (d) => {
        const memberRef = doc(db, 'schools', schoolId, 'clubs', d.id, 'members', userId)
        const memberSnap = await getDoc(memberRef)

        if (memberSnap.exists()) {
          const clubData = d.data()
          const memberData = memberSnap.data()

          joined.push({
            id: d.id,
            name: clubData.name,
            teacher: clubData.teacher,
            // Pull the emoji from the member doc (saved during your schedule review)
            emoji: memberData.emoji || '🤝', 
          })
        }
      })

      await Promise.all(memberChecks)
      
      // Update state with a fresh array to trigger a re-render
      setClubs([...joined])
      setLoading(false)
    })

    return unsub
  }, [schoolId, userId])

  return { clubs, loading }
}