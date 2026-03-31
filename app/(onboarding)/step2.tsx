import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

export default function Step2() {
  const router = useRouter()
  const [photo, setPhoto] = useState<string | null>(null)

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled) setPhoto(result.assets[0].uri)
  }

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.title}>Add a profile photo</Text>
      <Text style={styles.subtitle}>Optional — you can always add one later.</Text>

      <Pressable style={styles.photoButton} onPress={pick}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <Text style={styles.photoPlaceholder}>📷{'\n'}Tap to choose</Text>
        )}
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push('/(onboarding)/step3' as any)}>
        <Text style={styles.buttonText}>{photo ? 'Next →' : 'Skip for now'}</Text>
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
  photoButton: { width: 140, height: 140, borderRadius: 70, backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.border, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  photo: { width: 140, height: 140, borderRadius: 70 },
  photoPlaceholder: { color: Colors.muted, textAlign: 'center', fontSize: 15, lineHeight: 24 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})