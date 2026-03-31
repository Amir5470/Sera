import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { saveProfile } from '../../lib/profile'

const SPORTS = ['Football', 'Basketball', 'Soccer', 'Baseball', 'Volleyball', 'Tennis', 'Swimming', 'Track', 'Wrestling', 'Golf']
const INTERESTS = ['Robotics', 'Drama', 'Band', 'Choir', 'Art', 'Debate', 'Student Council', 'NHS', 'DECA', 'Gaming']

export default function Step4() {
  const { user } = useAuth()
  const router = useRouter()
  const [sports, setSports] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  const next = async () => {
    if (!user) return
    setLoading(true)
    await saveProfile(user.uid, { sports, interests })
    router.push('/(onboarding)/step5' as any)
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.title}>Your interests</Text>
      <Text style={styles.subtitle}>Select all that apply — skip if none fit.</Text>

      <Text style={styles.label}>Sports</Text>
      <View style={styles.chips}>
        {SPORTS.map(s => (
          <Pressable
            key={s}
            style={[styles.chip, sports.includes(s) && styles.chipActive]}
            onPress={() => toggle(sports, setSports, s)}
          >
            <Text style={[styles.chipText, sports.includes(s) && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Clubs & Activities</Text>
      <View style={styles.chips}>
        {INTERESTS.map(i => (
          <Pressable
            key={i}
            style={[styles.chip, interests.includes(i) && styles.chipActive]}
            onPress={() => toggle(interests, setInterests, i)}
          >
            <Text style={[styles.chipText, interests.includes(i) && styles.chipTextActive]}>{i}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={next} disabled={loading}>
        <Text style={styles.buttonText}>{sports.length + interests.length > 0 ? 'Next →' : 'Skip for now'}</Text>
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