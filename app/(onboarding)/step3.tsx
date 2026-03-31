import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { saveProfile } from '../../lib/profile'

const GRADES = ['9th', '10th', '11th', '12th']

export default function Step3() {
  const { user } = useAuth()
  const router = useRouter()
  const [school, setSchool] = useState('')
  const [city, setCity] = useState('')
  const [grade, setGrade] = useState('')
  const [loading, setLoading] = useState(false)

  const next = async () => {
    if (!school.trim() || !city.trim() || !grade) {
      Alert.alert('Required', 'Please fill in all fields.')
      return
    }
    if (!user) return
    setLoading(true)
    await saveProfile(user.uid, { school: school.trim(), city: city.trim(), grade })
    router.push('/(onboarding)/step4' as any)
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.title}>Your school</Text>
      <Text style={styles.subtitle}>Help us connect you with your school community.</Text>

      <TextInput
        style={styles.input}
        placeholder="School name (e.g. Worthington Kilbourne)"
        placeholderTextColor={Colors.muted}
        value={school}
        onChangeText={setSchool}
      />
      <TextInput
        style={styles.input}
        placeholder="City (e.g. Columbus, Ohio)"
        placeholderTextColor={Colors.muted}
        value={city}
        onChangeText={setCity}
      />

      <Text style={styles.label}>Grade</Text>
      <View style={styles.gradeRow}>
        {GRADES.map(g => (
          <Pressable
            key={g}
            style={[styles.gradeButton, grade === g && styles.gradeButtonActive]}
            onPress={() => setGrade(g)}
          >
            <Text style={[styles.gradeText, grade === g && styles.gradeTextActive]}>{g}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={next} disabled={loading}>
        <Text style={styles.buttonText}>Next →</Text>
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
  input: { backgroundColor: Colors.card, color: Colors.text, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, fontSize: 15 },
  label: { color: Colors.text, fontWeight: '600', marginBottom: 12, fontSize: 15 },
  gradeRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  gradeButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  gradeButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  gradeText: { color: Colors.muted, fontWeight: '600' },
  gradeTextActive: { color: '#fff' },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})