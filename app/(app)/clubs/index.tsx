import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../../constants/colors'

export default function Clubs() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Clubs & Groups</Text>
      <Text style={styles.empty}>No clubs yet. Create one!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40 },
})