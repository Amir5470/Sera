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

const { width } = Dimensions.get('window');

// USE THE DATED MODEL ID TO PREVENT 404 ERRORS
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022"; 
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY!;

interface ScannedClass {
  name: string;
  teacher: string;
  period: string;
  emoji: string;
  startTime?: string;
  endTime?: string;
}

const extractClasses = async (base64: string) => {
  if (!ANTHROPIC_KEY) {
    throw new Error('API Key is missing from environment');
  }

  try {
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
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64
              }
            },
            {
              type: 'text',
              text: "Extract all classes/clubs from this schedule. Return ONLY a JSON array. Format: [{\"name\":\"\",\"teacher\":\"\",\"period\":\"\",\"emoji\":\"\"}]"
            },
          ],
        }],
      }),
    });

    console.log("HTTP Status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.log("Error Body:", errorBody);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content[0].text;

    // Robust JSON extraction
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error("Invalid JSON from AI");
    
    const jsonStr = raw.substring(start, end + 1);
    return JSON.parse(jsonStr) as ScannedClass[];

  } catch (err) {
    console.error("Fetch Error:", err);
    throw err;
  }
}

export default function Schedule() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { classRooms, loading } = useClassRooms(profile?.schoolId, user?.uid)

  const [scanning, setScanning] = useState(false)
  const [managing, setManaging] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [scannedResults, setScannedResults] = useState<ScannedClass[]>([])
  const [saving, setSaving] = useState(false)

  // Improved Chronological Sorting
  const sortedClasses = useMemo(() => {
    if (!classRooms) return [];
    return [...classRooms].sort((a, b) => {
      const toMinutes = (t?: string) => {
        if (!t || !t.includes(':')) return 9999;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      return toMinutes(a.startTime) - toMinutes(b.startTime);
    });
  }, [classRooms]);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const processImage = async (base64: string) => {
    setScanning(true)
    try {
      // Robust base64 cleaning
      const cleanBase64 = base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

      const parsed = await extractClasses(cleanBase64)
      setScannedResults(parsed.map(c => ({ ...c, startTime: '', endTime: '' })))
      setReviewing(true)
    } catch (e) {
      Alert.alert('Error', 'Could not read schedule. Check your internet and API key.');
    } finally {
      setScanning(false)
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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied', 'Camera access is needed.');
    
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (!result.canceled && result.assets[0].base64) await processImage(result.assets[0].base64);
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied', 'Gallery access is needed.');

    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
    if (!result.canceled && result.assets[0].base64) await processImage(result.assets[0].base64);
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

      {/* REVIEW MODAL */}
      <Modal visible={reviewing} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Review Details</Text>
          <Text style={styles.subtitle}>Confirm your classes and add times (HH:MM).</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {scannedResults.map((item, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewEmoji}>{item.emoji}</Text>
                  <TextInput
                    style={styles.reviewInputBold}
                    value={item.name}
                    onChangeText={(v) => updateScannedField(index, 'name', v)}
                  />
                </View>
                <View style={styles.timeRow}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="Start (08:30)"
                    placeholderTextColor={Colors.muted}
                    value={item.startTime}
                    keyboardType="numbers-and-punctuation"
                    onChangeText={(v) => updateScannedField(index, 'startTime', v)}
                  />
                  <TextInput
                    style={styles.timeInput}
                    placeholder="End (09:20)"
                    placeholderTextColor={Colors.muted}
                    value={item.endTime}
                    keyboardType="numbers-and-punctuation"
                    onChangeText={(v) => updateScannedField(index, 'endTime', v)}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.saveButton} onPress={handleFinalSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Confirm Schedule</Text>}
          </Pressable>
          <Pressable onPress={() => setReviewing(false)} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: Colors.muted }}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      {/* MANAGE MODAL */}
      <Modal visible={managing && !reviewing} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage</Text>
            <Pressable onPress={() => setManaging(false)}><Text style={styles.modalClose}>Done</Text></Pressable>
          </View>

          <View style={styles.scanRow}>
            <Pressable style={styles.scanButton} onPress={takePhoto} disabled={scanning}>
              <Text style={styles.scanButtonText}>📷 Take Photo</Text>
            </Pressable>
            <Pressable style={styles.scanButton} onPress={pickImage} disabled={scanning}>
              <Text style={styles.scanButtonText}>🖼️ Upload</Text>
            </Pressable>
          </View>

          {scanning && <ActivityIndicator color={Colors.primary} style={{ marginBottom: 20 }} />}

          <FlatList
            data={classRooms}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.manageCard}>
                <Text style={styles.manageName}>{item.name}</Text>
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
  modal: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 20 },
  modalTitle: { color: Colors.text, fontSize: 26, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: Colors.muted, fontSize: 16, marginBottom: 24 },
  reviewCard: { backgroundColor: Colors.card, padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  reviewEmoji: { fontSize: 26 },
  reviewInputBold: { flex: 1, color: Colors.text, fontSize: 17, fontWeight: '700' },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeInput: { flex: 1, backgroundColor: Colors.background, color: Colors.text, padding: 12, borderRadius: 10, fontSize: 14, textAlign: 'center', borderWidth: 1, borderColor: Colors.border },
  saveButton: { backgroundColor: Colors.primary, padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalClose: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  scanRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  scanButton: { flex: 1, backgroundColor: Colors.card, padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  scanButtonText: { color: Colors.text, fontWeight: '600' },
  manageCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.card, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  manageName: { color: Colors.text, fontWeight: '600' },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40, fontSize: 15 }
})