import AsyncStorage from '@react-native-async-storage/async-storage'
import { Slot, useRouter, useSegments } from 'expo-router'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { db } from '../lib/firebase'

export default function RootLayout() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (authLoading || profileLoading) return

    const navigate = async () => {
      const inAuth = segments[0] === '(auth)'
      const inOnboarding = segments[0] === '(onboarding)'
      const inSplash = segments[0] === 'index'
      const inLanding = segments[0] === undefined || segments[0] === 'landing'

      // Don't redirect while on splash or index
      if (inSplash || inLanding) return

      if (!user) {
        const cachedUid = await AsyncStorage.getItem('sera_uid')
        if (cachedUid) {
          const snap = await getDoc(doc(db, 'userIndex', cachedUid))
          if (snap.exists() && snap.data().onboardingComplete) return
        }
        if (!inAuth) router.replace('/(auth)/sign-in' as any)
        return
      }

      if (user && inAuth) {
        if (!profile?.onboardingComplete) {
          router.replace('/(onboarding)/step1' as any)
        } else {
          router.replace('/(app)/feed' as any)
        }
        return
      }

      if (user && !inOnboarding && !profile?.onboardingComplete) {
        router.replace('/(onboarding)/step1' as any)
      }
    }

    navigate()
  }, [user, authLoading, profile, profileLoading, segments])

  return <Slot />
}