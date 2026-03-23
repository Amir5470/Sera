import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../../constants/colors'

export default function ClassRoom() {
  const { classId } = useLocalSearchParams()

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Class Room</Text>
      <Text style={styles.sub}>Chat coming soon...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  sub: { color: Colors.muted },
})