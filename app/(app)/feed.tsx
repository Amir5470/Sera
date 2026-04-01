import { useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView,
  Platform, Pressable, StyleSheet, Text, TextInput, View
} from 'react-native'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { useFeed } from '../../hooks/useFeed'
import { useProfile } from '../../hooks/useProfile'
import { useReplies } from '../../hooks/useReplies'
import { addReply, createPost, deletePost } from '../../lib/posts'

type PostCardProps = {
  post: any
  schoolId: string
  userId: string
  displayName: string
}

function PostCard({ post, schoolId, userId, displayName }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const { replies } = useReplies(expanded ? schoolId : undefined, post.id)
  const isAuthor = post.authorId === userId

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deletePost(schoolId, post.id)
      }
    ])
  }

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    await addReply(schoolId, post.id, replyText.trim(), displayName, userId)
    setReplyText('')
    setSending(false)
  }

  return (
    <View style={styles.card}>
      {/* Post header */}
      <View style={styles.postHeader}>
        <Text style={styles.author}>{post.authorName}</Text>
        <View style={styles.postActions}>
          {isAuthor && (
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      <View style={styles.postFooter}>
        <Text style={styles.time}>
          {new Date(post.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
        <Pressable onPress={() => setExpanded(!expanded)}>
          <Text style={styles.replyToggle}>{expanded ? 'Hide replies' : 'Reply'}</Text>
        </Pressable>
      </View>

      {/* Replies */}
      {expanded && (
        <View style={styles.repliesContainer}>
          {replies.map(reply => (
            <View key={reply.id} style={styles.reply}>
              <Text style={styles.replyAuthor}>{reply.authorName}</Text>
              <Text style={styles.replyText}>{reply.text}</Text>
              <Text style={styles.replyTime}>
                {new Date(reply.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}

          {/* Reply input */}
          <View style={styles.replyComposer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              placeholderTextColor={Colors.muted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <Pressable
              style={[styles.replyButton, (!replyText.trim() || sending) && styles.replyButtonDisabled]}
              onPress={submitReply}
              disabled={!replyText.trim() || sending}
            >
              <Text style={styles.replyButtonText}>↑</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

export default function FeedScreen() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { posts, loading } = useFeed(profile?.schoolId)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  const submit = async () => {
    if (!text.trim() || !user || !profile?.schoolId) return
    setPosting(true)
    await createPost(profile.schoolId, text.trim(), profile.displayName ?? 'Student', user.uid)
    setText('')
    setPosting(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Feed</Text>
      </View>

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

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              schoolId={profile?.schoolId ?? ''}
              userId={user?.uid ?? ''}
              displayName={profile?.displayName ?? 'Student'}
            />
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
  header: { paddingTop: 40, paddingHorizontal: 16, paddingBottom: 12 },
  headerText: { color: Colors.text, fontSize: 28, fontWeight: '700' },
  composer: { marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 12, padding: 12, gap: 8 },
  input: { color: Colors.text, fontSize: 15, minHeight: 60, textAlignVertical: 'top' },
  button: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, gap: 6 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  postActions: { flexDirection: 'row', gap: 8 },
  deleteButton: { paddingHorizontal: 8, paddingVertical: 4 },
  deleteText: { color: 'rgba(255,80,80,0.8)', fontSize: 12 },
  postText: { color: Colors.text, fontSize: 15, lineHeight: 21 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  time: { color: Colors.muted, fontSize: 12 },
  replyToggle: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  repliesContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, gap: 8 },
  reply: { paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: Colors.primary, gap: 2 },
  replyAuthor: { color: Colors.secondary, fontSize: 12, fontWeight: '600' },
  replyText: { color: Colors.text, fontSize: 14 },
  replyTime: { color: Colors.muted, fontSize: 11 },
  replyComposer: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-end' },
  replyInput: { flex: 1, backgroundColor: Colors.background, color: Colors.text, padding: 10, borderRadius: 10, fontSize: 14, maxHeight: 80, borderWidth: 1, borderColor: Colors.border },
  replyButton: { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  replyButtonDisabled: { opacity: 0.4 },
  replyButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40 },
})