import { useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors } from '../../../constants/colors'

const MOCK_CLASSES = [
  { id: '1', name: 'AP Physics', period: '1st', room: '204' },
  { id: '2', name: 'English Lit', period: '2nd', room: '115' },
]

export default function Classes() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Class Rooms</Text>
      {MOCK_CLASSES.map(c => (
        <TouchableOpacity key={c.id} style={styles.card} onPress={() => router.push(`/(app)/classes/${c.id}` as any)}>
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.sub}>{c.period} period • Room {c.room}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  card: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  name: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  sub: { color: Colors.muted, marginTop: 4 },
})