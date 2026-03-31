import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import { useClubs } from '../../../hooks/useClubs'

export default function Clubs() {
  const { clubs, loading } = useClubs()
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Clubs & Groups</Text>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/(app)/clubs/[clubId]', params: { clubId: item.clubId, name: item.name } } as any)}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.teacher !== 'Unknown' ? `Advisor: ${item.teacher}` : 'No advisor listed'}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No clubs yet.{'\n'}They'll appear here after scanning your schedule.</Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  card: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  name: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  sub: { color: Colors.muted, marginTop: 4 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40, lineHeight: 24 },
})