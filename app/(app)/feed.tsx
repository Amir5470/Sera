import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

export default function Feed() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>School Feed</Text>
      <Text style={styles.empty}>No posts yet. Be the first to post!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40 },
})