import { useLocalSearchParams } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Colors } from '../../../constants/colors'
import { useAuth } from '../../../hooks/useAuth'
import { useClassChat } from '../../../hooks/useClassChat'
import { sendMessage } from '../../../lib/chat'

export default function ClubRoom() {
  const { clubId, name } = useLocalSearchParams<{ clubId: string; name: string }>()
  const { user } = useAuth()
  const { messages, loading } = useClassChat(clubId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  const submit = async () => {
    if (!text.trim() || !user) return
    setSending(true)
    await sendMessage(clubId, text.trim(), user.displayName ?? 'Student', user.uid)
    setText('')
    setSending(false)
    listRef.current?.scrollToEnd({ animated: true })
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>{name ?? 'Club'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.authorId === user?.uid
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                {!isMe && <Text style={styles.author}>{item.authorName}</Text>}
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet. Say something!</Text>
          }
        />
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={Colors.muted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
          onPress={submit}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerText: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, gap: 4 },
  bubbleMe: { backgroundColor: Colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  author: { color: Colors.secondary, fontSize: 12, fontWeight: '600' },
  messageText: { color: Colors.text, fontSize: 15 },
  time: { color: 'rgba(255,255,255,0.5)', fontSize: 11, alignSelf: 'flex-end' },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40 },
  composer: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.card, color: Colors.text, padding: 12, borderRadius: 12, fontSize: 15, maxHeight: 100 },
  sendButton: { backgroundColor: Colors.primary, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#fff', fontWeight: '600' },
})