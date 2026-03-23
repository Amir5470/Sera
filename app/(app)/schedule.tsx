import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { useSchedule } from '../../hooks/useSchedule'

export default function Schedule() {
  const { classes } = useSchedule()

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Schedule</Text>
      {classes.length === 0
        ? <Text style={styles.empty}>No classes added yet.</Text>
        : classes.map((c: any) => (
          <View key={c.id} style={styles.card}>
            <Text style={styles.className}>{c.name}</Text>
            <Text style={styles.classTime}>{c.period} • {c.room}</Text>
          </View>
        ))
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  className: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  classTime: { color: Colors.muted, marginTop: 4 },
})