import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Colors } from '../constants/colors'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

export default function RootLayout() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (authLoading || profileLoading) return

    const inAuth = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inApp = segments[0] === '(app)'

    if (!user && !inAuth) {
      router.replace('/(auth)/sign-in' as any)
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
  }, [user, authLoading, profile, profileLoading])

  if (authLoading || profileLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  )

  return <Slot />
}