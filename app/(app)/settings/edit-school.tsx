import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Colors } from '../../../constants/colors'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { saveProfileIndex } from '../../../lib/profile'
import { findOrCreateSchool, searchSchools } from '../../../lib/schools'

const GRADES = ['9th', '10th', '11th', '12th']

export default function EditSchool() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()

  const [school, setSchool] = useState('')
  const [city, setCity] = useState('')
  const [grade, setGrade] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(false)
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; city: string }[]>([])
  const [schoolSelected, setSchoolSelected] = useState(false)

  // Pre-fill with current values
  useEffect(() => {
    if (profile) {
      setSchool(profile.school || '')
      setCity(profile.city || '')
      setGrade(profile.grade || '')
      setSchoolSelected(true)
    }
  }, [profile])

  useEffect(() => {
    if (schoolSelected) return
    const timeout = setTimeout(async () => {
      if (school.length < 2) { setSuggestions([]); return }
      const results = await searchSchools(school)
      setSuggestions(results)
    }, 300)
    return () => clearTimeout(timeout)
  }, [school, schoolSelected])

  const selectSchool = (s: { id: string; name: string; city: string }) => {
    setSchool(s.name)
    setCity(s.city)
    setSuggestions([])
    setSchoolSelected(true)
  }

  const showToast = () => {
    setToast(true)
    setTimeout(() => {
      setToast(false)
      router.back()
    }, 1500)
  }

  const save = async () => {
    if (!school.trim() || !city.trim() || !grade) return
    if (!user) return
    setLoading(true)
    const schoolId = await findOrCreateSchool(school, city)
    await saveProfileIndex(user.uid, {
      school: school.trim(),
      city: city.trim(),
      grade,
      schoolId,
    })
    setLoading(false)
    showToast()
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit School</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>School Name</Text>
          <View style={styles.autocompleteContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. West Jefferson High School"
              placeholderTextColor={Colors.muted}
              value={school}
              onChangeText={(t) => { setSchool(t); setSchoolSelected(false) }}
            />
            {suggestions.length > 0 && (
              <View style={styles.suggestions}>
                {suggestions.map(s => (
                  <Pressable key={s.id} style={styles.suggestion} onPress={() => selectSchool(s)}>
                    <Text style={styles.suggestionName}>{s.name}</Text>
                    <Text style={styles.suggestionCity}>{s.city}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Columbus, OH"
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
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={save}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>School updated</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    marginBottom: 36,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  form: { gap: 6, marginBottom: 32 },
  label: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 16,
  },
  autocompleteContainer: { position: 'relative', zIndex: 10 },
  input: {
    backgroundColor: Colors.card,
    color: Colors.text,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 15,
  },
  suggestions: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestion: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionName: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  suggestionCity: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  gradeRow: { flexDirection: 'row', gap: 10 },
  gradeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradeButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  gradeText: { color: Colors.muted, fontWeight: '600' },
  gradeTextActive: { color: '#fff' },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  toast: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 14 },
})
