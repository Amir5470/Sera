import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Colors } from '../../../constants/colors'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { saveProfileIndex } from '../../../lib/profile'

const NOTIFICATIONS = [
  'New posts on Feed',
  'Class Room messages',
  'Club messages',
  'School events',
  'Announcements',
]

export default function EditNotifications() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()

  const [notifications, setNotifications] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(false)

  // Pre-fill with current values
  useEffect(() => {
    if (profile?.notifications) {
      setNotifications(profile.notifications)
    }
  }, [profile])

  const toggle = (item: string) => {
    setNotifications(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const showToast = () => {
    setToast(true)
    setTimeout(() => {
      setToast(false)
      router.back()
    }, 1500)
  }

  const save = async () => {
    if (!user) return
    setLoading(true)
    await saveProfileIndex(user.uid, { notifications })
    setLoading(false)
    showToast()
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.sectionLabel}>Notify me about</Text>

        <View style={styles.card}>
          {NOTIFICATIONS.map((item, index) => {
            const active = notifications.includes(item)
            return (
              <View key={item}>
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                  onPress={() => toggle(item)}
                >
                  <Text style={styles.rowText}>{item}</Text>
                  <View style={[styles.toggle, active && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, active && styles.toggleThumbActive]} />
                  </View>
                </Pressable>
                {index < NOTIFICATIONS.length - 1 && <View style={styles.divider} />}
              </View>
            )
          })}
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
          <Text style={styles.toastText}>Notifications updated</Text>
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
  sectionLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowText: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 16 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
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
