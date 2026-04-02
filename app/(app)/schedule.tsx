import * as ImagePicker from 'expo-image-picker'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator, Alert,
  Dimensions,
  FlatList, Modal, Pressable,
  ScrollView,
  StyleSheet, Text, TextInput, View
} from 'react-native'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { useClassRooms } from '../../hooks/useClassRooms'
import { useProfile } from '../../hooks/useProfile'
import { joinOrCreateClass, leaveClass } from '../../lib/classes'

const { width } = Dimensions.get('window')
const CLAUDE_MODEL = "claude-haiku-4-5-20251001"
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY!

interface ScannedClass {
  name: string
  teacher: string
  period: string
  emoji: string
  startTime?: string
  endTime?: string
}

interface PeriodTime {
  period: string
  startTime: string
  endTime: string
}

// --- NEW STABLE BASE64 CONVERTER ---
const uriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract only the base64 content
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const callClaude = async (base64: string, prompt: string) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error("Claude API Error:", err)
    throw new Error(`API ${response.status}: ${err}`)
  }

  const data = await response.json()
  const raw = data.content[0].text
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array found')
  return JSON.parse(raw.substring(start, end + 1))
}

const extractClasses = async (base64: string): Promise<ScannedClass[]> => {
  return callClaude(base64, `Extract all classes/clubs from this school schedule image. Return ONLY a JSON array. Format: [{"name":"Class Name","teacher":"Teacher Name","period":"1st","emoji":"📚"}]`)
}

const extractTimes = async (base64: string): Promise<PeriodTime[]> => {
  return callClaude(base64, `Extract the bell schedule / period times from this image. Return ONLY a JSON array. Format: [{"period":"1st","startTime":"08:40","endTime":"09:30"}]`)
}

const mergeTimes = (classes: ScannedClass[], times: PeriodTime[]): ScannedClass[] => {
  return classes.map(cls => {
    const normalize = (p: string) => p.toLowerCase().replace(/(st|nd|rd|th)/g, '').trim()
    const match = times.find(t => normalize(t.period) === normalize(cls.period))
    return {
      ...cls,
      startTime: match?.startTime || '',
      endTime: match?.endTime || '',
    }
  })
}

export default function Schedule() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { classRooms, loading } = useClassRooms(profile?.schoolId, user?.uid)

  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState<'idle' | 'schedule' | 'times'>('idle')
  const [managing, setManaging] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [scannedClasses, setScannedClasses] = useState<ScannedClass[]>([])
  const [scannedResults, setScannedResults] = useState<ScannedClass[]>([])
  const [saving, setSaving] = useState(false)

  const sortedClasses = useMemo(() => {
    if (!classRooms) return []
    return [...classRooms].sort((a, b) => {
      const toMinutes = (t?: string) => {
        if (!t || !t.includes(':')) return 9999
        const [h, m] = t.split(':').map(Number)
        return h < 7 ? (h + 12) * 60 + m : h * 60 + m
      }
      return toMinutes(a.startTime) - toMinutes(b.startTime)
    })
  }, [classRooms])

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const pickOrTakePhoto = async (useCamera: boolean): Promise<string | null> => {
    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync() 
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission Denied', 'Access needed to continue.');
      return null;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

    if (result.canceled || !result.assets[0]) return null;

    try {
      setScanning(true);
      return await uriToBase64(result.assets[0].uri);
    } catch (e) {
      Alert.alert("Error", "Could not process image.");
      return null;
    }
  }

  const startScheduleScan = async (useCamera: boolean) => {
    const base64 = await pickOrTakePhoto(useCamera)
    if (!base64) { setScanning(false); return }

    setManaging(false)
    setScanStep('schedule')
    try {
      const classes = await extractClasses(base64)
      setScannedClasses(classes)
      setScanStep('times')
    } catch (e) {
      Alert.alert('Error', 'Could not read schedule.')
      setScanStep('idle')
    } finally {
      setScanning(false)
    }
  }

  const scanTimesPhoto = async (useCamera: boolean) => {
    const base64 = await pickOrTakePhoto(useCamera)
    if (!base64) {
      setScannedResults(scannedClasses.map(c => ({ ...c, startTime: '', endTime: '' })))
      setReviewing(true)
      setScanning(false)
      setScanStep('idle')
      return
    }

    try {
      const times = await extractTimes(base64)
      const merged = mergeTimes(scannedClasses, times)
      setScannedResults(merged)
      setReviewing(true)
    } catch (e) {
      setScannedResults(scannedClasses.map(c => ({ ...c, startTime: '', endTime: '' })))
      setReviewing(true)
    } finally {
      setScanning(false)
      setScanStep('idle')
    }
  }

  const handleFinalSave = async () => {
    if (!user || !profile?.schoolId) return
    setSaving(true)
    try {
      await Promise.all(
        scannedResults.map(cls => joinOrCreateClass(user.uid, profile.schoolId, cls))
      )
      setReviewing(false)
      setManaging(false)
    } catch (e) {
      Alert.alert('Error', 'Failed to save classes.')
    } finally {
      setSaving(false)
    }
  }

  const updateScannedField = (index: number, field: keyof ScannedClass, value: string) => {
    const updated = [...scannedResults]
    updated[index] = { ...updated[index], [field]: value }
    setScannedResults(updated)
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Schedule</Text>
        <Text style={styles.dateText}>{today}</Text>
      </View>

      <FlatList
        data={sortedClasses}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.emojiContainer}>
              <Text style={styles.emojiText}>{item.emoji || '📖'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.className}>{item.name}</Text>
              <Text style={styles.classDetail}>
                {item.period} • {item.startTime || '--:--'} - {item.endTime || '--:--'}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No classes yet. Tap Manage to add.</Text>}
      />

      <Pressable style={styles.manageButton} onPress={() => setManaging(true)}>
        <Text style={styles.manageButtonText}>⚙️ Manage Schedule</Text>
      </Pressable>

      <Modal visible={scanStep === 'times'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Add Times</Text>
          <Text style={styles.subtitle}>Scan your bell schedule to add period times.</Text>
          {scanning ? (
            <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
          ) : (
            <>
              <View style={styles.scanRow}>
                <Pressable style={styles.scanButton} onPress={() => scanTimesPhoto(true)}><Text style={styles.scanButtonText}>📷 Take Photo</Text></Pressable>
                <Pressable style={styles.scanButton} onPress={() => scanTimesPhoto(false)}><Text style={styles.scanButtonText}>🖼️ Upload</Text></Pressable>
              </View>
              <Pressable style={styles.skipButton} onPress={() => { setScannedResults(scannedClasses.map(c => ({ ...c, startTime: '', endTime: '' }))); setReviewing(true); setScanStep('idle'); }}>
                <Text style={styles.skipText}>Skip — add times manually</Text>
              </Pressable>
            </>
          )}
        </View>
      </Modal>

      <Modal visible={reviewing} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Review Details</Text>
          <ScrollView style={{ flex: 1 }}>
            {scannedResults.map((item, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewEmoji}>{item.emoji}</Text>
                  <TextInput style={styles.reviewInputBold} value={item.name} onChangeText={(v) => updateScannedField(index, 'name', v)} />
                </View>
                <View style={styles.timeRow}>
                  <TextInput style={styles.timeInput} placeholder="Start" value={item.startTime} onChangeText={(v) => updateScannedField(index, 'startTime', v)} />
                  <TextInput style={styles.timeInput} placeholder="End" value={item.endTime} onChangeText={(v) => updateScannedField(index, 'endTime', v)} />
                </View>
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.saveButton} onPress={handleFinalSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Confirm Schedule</Text>}
          </Pressable>
          <Pressable onPress={() => setReviewing(false)} style={{ marginTop: 16, alignItems: 'center' }}><Text style={{ color: Colors.muted }}>Cancel</Text></Pressable>
        </View>
      </Modal>

      <Modal visible={managing && scanStep === 'idle' && !reviewing} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage</Text>
            <Pressable onPress={() => setManaging(false)}><Text style={styles.modalClose}>Done</Text></Pressable>
          </View>
          {scanning ? (
            <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /><Text style={styles.scanningText}>Reading schedule...</Text></View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Scan your schedule</Text>
              <View style={styles.scanRow}>
                <Pressable style={styles.scanButton} onPress={() => startScheduleScan(true)}><Text style={styles.scanButtonText}>📷 Take Photo</Text></Pressable>
                <Pressable style={styles.scanButton} onPress={() => startScheduleScan(false)}><Text style={styles.scanButtonText}>🖼️ Upload</Text></Pressable>
              </View>
            </>
          )}
          <FlatList
            data={classRooms}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.manageCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.manageName}>{item.emoji} {item.name}</Text>
                  <Text style={styles.manageSub}>{item.startTime || '--:--'} - {item.endTime || '--:--'}</Text>
                </View>
                <Pressable onPress={() => leaveClass(user!.uid, profile!.schoolId, item.id)}>
                  <Text style={{ color: '#FF4444', fontWeight: '600' }}>Remove</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 },
  header: { fontSize: 28, fontWeight: '900', color: Colors.text },
  dateText: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  card: { backgroundColor: Colors.card, padding: 16, borderRadius: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 14 },
  emojiContainer: { width: 48, height: 48, backgroundColor: Colors.background, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 24 },
  className: { color: Colors.text, fontWeight: '700', fontSize: 17, marginBottom: 2 },
  classDetail: { color: Colors.muted, fontSize: 13, fontWeight: '500' },
  manageButton: { backgroundColor: Colors.card, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  manageButtonText: { color: Colors.primary, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  scanningText: { color: Colors.muted, fontSize: 15 },
  modal: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 20 },
  modalTitle: { color: Colors.text, fontSize: 26, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: Colors.muted, fontSize: 15, marginBottom: 24, lineHeight: 22 },
  sectionLabel: { color: Colors.muted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  reviewCard: { backgroundColor: Colors.card, padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  reviewEmoji: { fontSize: 26 },
  reviewInputBold: { flex: 1, color: Colors.text, fontSize: 17, fontWeight: '700' },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeInput: { flex: 1, backgroundColor: Colors.background, color: Colors.text, padding: 12, borderRadius: 10, fontSize: 14, textAlign: 'center', borderWidth: 1, borderColor: Colors.border },
  saveButton: { backgroundColor: Colors.primary, padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  skipButton: { padding: 16, alignItems: 'center' },
  skipText: { color: Colors.muted, fontSize: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalClose: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  scanRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  scanButton: { flex: 1, backgroundColor: Colors.card, padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  scanButtonText: { color: Colors.text, fontWeight: '600' },
  manageCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.card, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  manageName: { color: Colors.text, fontWeight: '600' },
  manageSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40, fontSize: 15 },
})