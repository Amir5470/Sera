import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { useSchedule } from '../../hooks/useSchedule'
import { joinOrCreateClass } from '../../lib/classes'

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY!

const extractClasses = async (base64: string) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
            },
            {
              type: 'text',
              text: `Extract all classes and clubs/activities from this school schedule image. Return ONLY a JSON array, no markdown, no explanation. Format:
[{"name":"Class Name","teacher":"Teacher Name","period":"1st","type":"class"}]
For the "type" field: use "class" for academic subjects (Math, English, Science, History etc), use "club" for extracurriculars, teams, clubs, or activities (Robotics, Band, Drama, Sports etc).
If teacher is not visible use "Unknown". Period should be like "1st", "2nd", "3rd" etc or the time if periods aren't numbered.`,
            },
          ],
        },
      ],
    }),
  })

  const data = await response.json()
  console.log('API response:', JSON.stringify(data))

  if (!data.content?.[0]?.text) throw new Error('No response from API')

  const text = data.content[0].text.trim()
  console.log('Claude text:', text)

  return JSON.parse(text) as { name: string; teacher: string; period: string }[]
}

export default function Schedule() {
  const { classes } = useSchedule()
  const { user } = useAuth()
  const [scanning, setScanning] = useState(false)

  const processImage = async (base64: string) => {
    if (!user) return
    setScanning(true)
    try {
      const parsed = await extractClasses(base64)
      for (const cls of parsed) {
        await joinOrCreateClass(user.uid, cls)
      }
      Alert.alert('Done!', `Added ${parsed.length} classes to your schedule.`)
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Could not read schedule. Try a clearer photo.')
    } finally {
      setScanning(false)
    }
  }

  const scanSchedule = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0].base64) return
    await processImage(result.assets[0].base64)
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to scan your schedule.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
    if (result.canceled || !result.assets[0].base64) return
    await processImage(result.assets[0].base64)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Schedule</Text>

      <View style={styles.buttonRow}>
        <Pressable style={styles.scanButton} onPress={takePhoto} disabled={scanning}>
          <Text style={styles.scanButtonText}>📷 Take Photo</Text>
        </Pressable>
        <Pressable style={styles.scanButton} onPress={scanSchedule} disabled={scanning}>
          <Text style={styles.scanButtonText}>🖼️ Upload Photo</Text>
        </Pressable>
      </View>

      {scanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.scanningText}>Reading your schedule...</Text>
        </View>
      )}

      <FlatList
        data={classes}
        keyExtractor={item => item.id}
        contentContainerStyle={{ gap: 12, paddingTop: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.classDetail}>Period {item.period}</Text>
            <Text style={styles.classDetail}>{item.teacher}</Text>
          </View>
        )}
        ListEmptyComponent={
          !scanning ? (
            <Text style={styles.empty}>
              No classes yet.{'\n'}Scan your schedule to get started.
            </Text>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  scanButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  scanningContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  scanningText: { color: Colors.muted, fontSize: 14 },
  card: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  className: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  classDetail: { color: Colors.muted, fontSize: 14 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40, lineHeight: 24 },
})