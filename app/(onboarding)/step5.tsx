import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { completeOnboarding, saveProfileIndex } from '../../lib/profile'

const NOTIFICATIONS = ['New posts on Feed', 'Class Room messages', 'Club messages', 'School events', 'Announcements']
const HEARD_FROM = ['Friend', 'Teacher', 'Social media', 'School announcement', 'Other']

export default function Step5() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()
  const { edit } = useLocalSearchParams() as { edit?: string }
  const isEdit = edit === 'true'
  const [notifications, setNotifications] = useState<string[]>([])
  const [heardFrom, setHeardFrom] = useState('')
  const [loading, setLoading] = useState(false)

  const toggle = (item: string) => {
    setNotifications(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const finish = async () => {
    if (!user || !profile?.schoolId) return
    setLoading(true)
    await saveProfileIndex(user.uid, { notifications, heardFrom })
    await completeOnboarding(user.uid, profile.schoolId)
    if (isEdit) {
      router.replace('/(app)/settings' as any)
    } else {
      router.replace('/(app)/feed' as any)
    }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.progress}>
        {[...Array(5)].map((_, i) => (
          <View key={i} style={[styles.dot, styles.dotActive]} />
        ))}
      </View>
      <Text style={styles.title}>Almost done!</Text>
      <Text style={styles.subtitle}>A couple last things.</Text>

      <Text style={styles.label}>Notify me about</Text>
      <View style={styles.chips}>
        {NOTIFICATIONS.map(n => (
          <Pressable
            key={n}
            style={[styles.chip, notifications.includes(n) && styles.chipActive]}
            onPress={() => toggle(n)}
          >
            <Text style={[styles.chipText, notifications.includes(n) && styles.chipTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>How did you hear about Sera?</Text>
      <View style={styles.chips}>
        {HEARD_FROM.map(h => (
          <Pressable
            key={h}
            style={[styles.chip, heardFrom === h && styles.chipActive]}
            onPress={() => setHeardFrom(h)}
          >
            <Text style={[styles.chipText, heardFrom === h && styles.chipTextActive]}>{h}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={finish} disabled={loading}>
        <Text style={styles.buttonText}>{isEdit ? 'Save' : "Let's go 🌅"}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 80 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 48 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.card },
  dotActive: { backgroundColor: Colors.primary },
  title: { color: Colors.text, fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: Colors.muted, fontSize: 15, marginBottom: 32 },
  label: { color: Colors.text, fontWeight: '600', fontSize: 15, marginBottom: 12, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.muted, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})