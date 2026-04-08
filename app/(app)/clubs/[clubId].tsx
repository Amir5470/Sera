import { useHeaderHeight } from "@react-navigation/elements";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/colors";
import { clubstyles } from "../../../constants/styles";
import { useAuth } from "../../../hooks/useAuth";
import { useClassChat } from "../../../hooks/useClassChat";
import { useProfile } from "../../../hooks/useProfile";
import { sendMessage } from "../../../lib/chat";
import { db } from "../../../lib/firebase";
import { sanitizeText } from "../../../lib/inputSanitizer";

const { width } = Dimensions.get("window");

export default function ClubRoom() {
  const {
    clubId,
    name,
    schoolId: paramSchoolId,
  } = useLocalSearchParams<{
    clubId: string;
    name: string;
    schoolId: string;
  }>();

  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();

  // 1. Resolve IDs
  const resolvedSchoolId = paramSchoolId || profile?.schoolId;
  const { messages, loading } = useClassChat(resolvedSchoolId, clubId, true);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();

  // 2. ACCESS GUARD: If user leaves the club via Schedule, kick them out of the chat instantly
  useEffect(() => {
    if (!user || !resolvedSchoolId || !clubId) return;

    const memberRef = doc(
      db,
      "schools",
      resolvedSchoolId,
      "clubs",
      clubId,
      "members",
      user.uid,
    );

    const unsub = onSnapshot(memberRef, (docSnap) => {
      if (!docSnap.exists()) {
        // User is no longer a member, redirect to clubs list
        router.replace("/(app)/clubs" as any);
      }
    });

    return unsub;
  }, [user?.uid, resolvedSchoolId, clubId]);

  // 3. Submit Message Logic
  const submit = async () => {
    if (!text.trim() || !user || !resolvedSchoolId || !clubId) return;

    const senderName = profile?.displayName || user.displayName || "Student";

    let cleaned: string;
    try {
      cleaned = sanitizeText(text, 1000);
    } catch (e: any) {
      Alert.alert("Invalid message", e.message || "Message not allowed.");
      return;
    }

    setSending(true);
    try {
      await sendMessage(
        resolvedSchoolId,
        clubId,
        true, // isClub = true
        cleaned,
        senderName,
        user.uid,
      );
      setText("");
      // Small timeout to allow the keyboard/list to adjust before scrolling
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error("Send failed:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // iOS needs 'padding', Android usually needs 'height' or nothing (undefined)
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // This is crucial: it tells the view how much space the top bar takes
        keyboardVerticalOffset={headerHeight}
      >
        {/* HEADER */}
        <View style={clubstyles.header}>
          <Pressable
            onPress={() => router.back()}
            style={clubstyles.backButton}
          >
            <Text style={clubstyles.backText}>←</Text>
          </Pressable>
          <View>
            <Text style={clubstyles.headerText} numberOfLines={1}>
              {name ?? "Club Chat"}
            </Text>
          </View>
        </View>

        {/* CHAT LIST */}
        {loading ? (
          <View style={clubstyles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={clubstyles.listContent}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => {
              const isMe = item.authorId === user?.uid;
              return (
                <View
                  style={[
                    clubstyles.bubble,
                    isMe ? clubstyles.bubbleMe : clubstyles.bubbleThem,
                  ]}
                >
                  {!isMe && (
                    <Text style={clubstyles.author}>{item.authorName}</Text>
                  )}
                  <Text style={clubstyles.messageText}>{item.text}</Text>
                  <Text
                    style={[
                      clubstyles.time,
                      isMe ? clubstyles.timeMe : clubstyles.timeThem,
                    ]}
                  >
                    {new Date(item.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={clubstyles.center}>
                <Text style={clubstyles.emptyText}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* COMPOSER */}
        <View style={clubstyles.composer}>
          <TextInput
            style={clubstyles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.muted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[
              clubstyles.sendButton,
              (!text.trim() || sending) && clubstyles.sendButtonDisabled,
            ]}
            onPress={submit}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={clubstyles.sendButtonText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
