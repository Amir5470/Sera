import AsyncStorage from '@react-native-async-storage/async-storage'
import { onAuthStateChanged, User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../lib/firebase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await AsyncStorage.setItem('sera_uid', u.uid)
        setUser(u)
        setLoading(false)
      } else {
        // Check if we have a cached UID
        const cachedUid = await AsyncStorage.getItem('sera_uid')
        if (cachedUid) {
          // Keep loading while Firebase restores session
          // Give it 3 seconds before giving up
          setTimeout(() => {
            setUser(null)
            setLoading(false)
          }, 3000)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    })
    return unsub
  }, [])

  return { user, loading }
}