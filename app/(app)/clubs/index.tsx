import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../hooks/useAuth';
import { useClubs } from '../../../hooks/useClubs'; // This hook now handles the "disappearing" logic
import { useProfile } from '../../../hooks/useProfile';

export default function Clubs() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { clubs, loading } = useClubs(profile?.schoolId, user?.uid)
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Clubs & Groups</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({
                pathname: '/(app)/clubs/[clubId]',
                params: { 
                  clubId: item.id, 
                  name: item.name, 
                  schoolId: profile?.schoolId 
                }
              } as any)}
            >
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>{item.emoji || '🤝'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>
                  {item.teacher && item.teacher !== 'Unknown' 
                    ? `Advisor: ${item.teacher}` 
                    : 'Group Chat'}
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Clubs Found</Text>
              <Text style={styles.emptySub}>
                Clubs from your schedule will automatically appear here once scanned.
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20, paddingTop: 40 },
  center: { marginTop: 50 },
  header: { fontSize: 32, fontWeight: '900', color: Colors.text, marginBottom: 24 },
  
  card: { 
    backgroundColor: Colors.card, 
    padding: 16, 
    borderRadius: 18, 
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: Colors.border,
    gap: 14
  },
  emojiContainer: {
    width: 44,
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border
  },
  emojiText: { fontSize: 22 },
  name: { color: Colors.text, fontWeight: '800', fontSize: 17 },
  sub: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  chevron: { color: Colors.muted, fontSize: 18, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: Colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 22 },
})