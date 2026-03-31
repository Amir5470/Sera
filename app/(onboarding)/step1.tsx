import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { saveProfile } from '../../lib/profile'

export default function Step1() {
  const { user } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const next = async () => {
    if (!displayName.trim() || !username.trim()) {
      Alert.alert('Required', 'Please fill in both fields.')
      return
    }
    if (!user) return
    setLoading(true)
    await saveProfile(user.uid, { displayName: displayName.trim(), username: username.trim().toLowerCase() })
    router.push('/(onboarding)/step2' as any)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.title}>What's your name?</Text>
      <Text style={styles.subtitle}>This is how you'll appear to your school.</Text>
      <TextInput
        style={styles.input}
        placeholder="Display name (e.g. Amir M.)"
        placeholderTextColor={Colors.muted}
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="Username (e.g. amir5470)"
        placeholderTextColor={Colors.muted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={next} disabled={loading}>
        <Text style={styles.buttonText}>Next →</Text>
      </Pressable>
    </View>
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
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})