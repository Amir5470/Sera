import { useLocalSearchParams, useRouter } from 'expo-router'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
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
import { useProfile } from '../../../hooks/useProfile'
import { sendMessage } from '../../../lib/chat'
import { db } from '../../../lib/firebase'

const { width } = Dimensions.get('window')

export default function ClubRoom() {
  const { clubId, name, schoolId: paramSchoolId } = useLocalSearchParams<{ 
    clubId: string; 
    name: string; 
    schoolId: string 
  }>()
  
  const { user } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()
  
  // 1. Resolve IDs
  const resolvedSchoolId = paramSchoolId || profile?.schoolId
  const { messages, loading } = useClassChat(resolvedSchoolId, clubId, true)
  
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  // 2. ACCESS GUARD: If user leaves the club via Schedule, kick them out of the chat instantly
  useEffect(() => {
    if (!user || !resolvedSchoolId || !clubId) return;

    const memberRef = doc(db, 'schools', resolvedSchoolId, 'clubs', clubId, 'members', user.uid);
    
    const unsub = onSnapshot(memberRef, (docSnap) => {
      if (!docSnap.exists()) {
        // User is no longer a member, redirect to clubs list
        router.replace('/(app)/clubs' as any);
      }
    });

    return unsub;
  }, [user?.uid, resolvedSchoolId, clubId]);

  // 3. Submit Message Logic
  const submit = async () => {
    if (!text.trim() || !user || !resolvedSchoolId || !clubId) return
    
    const senderName = profile?.displayName || user.displayName || 'Student'
    
    setSending(true)
    try {
      await sendMessage(
        resolvedSchoolId, 
        clubId, 
        true, // isClub = true
        text.trim(), 
        senderName, 
        user.uid
      )
      setText('')
      // Small timeout to allow the keyboard/list to adjust before scrolling
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    } catch (e) {
      console.error("Send failed:", e)
    } finally {
      setSending(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View>
          <Text style={styles.headerText} numberOfLines={1}>{name ?? 'Club Chat'}</Text>
          <Text style={styles.onlineStatus}>• Active Now</Text>
        </View>
      </View>

      {/* CHAT LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.authorId === user?.uid
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                {!isMe && <Text style={styles.author}>{item.authorName}</Text>}
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={[styles.time, isMe ? styles.timeMe : styles.timeThem]}>
                  {new Date(item.createdAt).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />
      )}

      {/* COMPOSER */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
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
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  backButton: { paddingVertical: 4 },
  backText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  headerText: { color: Colors.text, fontSize: 20, fontWeight: '800', maxWidth: width * 0.6 },
  onlineStatus: { color: '#4ADE80', fontSize: 11, fontWeight: '600' },

  listContent: { padding: 16, paddingBottom: 30, gap: 12 },
  
  bubble: { 
    maxWidth: '82%', 
    padding: 12, 
    borderRadius: 18, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  bubbleMe: { 
    backgroundColor: Colors.primary, 
    alignSelf: 'flex-end', 
    borderBottomRightRadius: 4 
  },
  bubbleThem: { 
    backgroundColor: Colors.card, 
    alignSelf: 'flex-start', 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border
  },
  
  author: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  messageText: { color: Colors.text, fontSize: 15, lineHeight: 20 },
  
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  timeThem: { color: Colors.muted },

  emptyText: { color: Colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 20 },

  composer: { 
    flexDirection: 'row', 
    padding: 16, 
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    gap: 10, 
    borderTopWidth: 1, 
    borderTopColor: Colors.border,
    backgroundColor: Colors.background
  },
  input: { 
    flex: 1, 
    backgroundColor: Colors.card, 
    color: Colors.text, 
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 24, 
    fontSize: 15, 
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border
  },
  sendButton: { 
    backgroundColor: Colors.primary, 
    width: 60,
    height: 44,
    borderRadius: 22, 
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})