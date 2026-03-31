import { useState } from 'react'
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, Pressable, StyleSheet, Text, TextInput, View
} from 'react-native'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { useFeed } from '../../hooks/useFeed'
import { createPost } from '../../lib/posts'

export default function FeedScreen() {
  const { user } = useAuth()
  const { posts, loading } = useFeed()
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  const submit = async () => {
    if (!text.trim() || !user) return
    setPosting(true)
    await createPost(text.trim(), user.displayName ?? 'Student', user.uid)
    setText('')
    setPosting(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Feed</Text>
      </View>

      {/* Post composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="What's happening at school?"
          placeholderTextColor={Colors.muted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable
          style={[styles.button, (!text.trim() || posting) && styles.buttonDisabled]}
          onPress={submit}
          disabled={!text.trim() || posting}
        >
          <Text style={styles.buttonText}>Post</Text>
        </Pressable>
      </View>

      {/* Feed list */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.author}>{item.authorName}</Text>
              <Text style={styles.postText}>{item.text}</Text>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No posts yet. Be the first!</Text>
          }
        />
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12 },
  headerText: { color: Colors.text, fontSize: 28, fontWeight: '700' },
  composer: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  input: {
    color: Colors.text,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  author: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  postText: { color: Colors.text, fontSize: 15, lineHeight: 21 },
  time: { color: Colors.muted, fontSize: 12 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40 },
})