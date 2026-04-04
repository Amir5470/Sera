import { useHeaderHeight } from "@react-navigation/elements";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { classstyles } from "../../../constants/styles";
import { useAuth } from "../../../hooks/useAuth";
import { useClassChat } from "../../../hooks/useClassChat";
import { useProfile } from "../../../hooks/useProfile";
import { sendMessage } from "../../../lib/chat";
export default function ClassRoom() {
  const { classId, name, schoolId } = useLocalSearchParams<{
    classId: string;
    name: string;
    schoolId: string;
  }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const resolvedSchoolId = schoolId ?? profile?.schoolId;
  const { messages, loading } = useClassChat(resolvedSchoolId, classId, false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();
  const router = useRouter();

  const submit = async () => {
    if (!text.trim() || !user || !resolvedSchoolId || !classId) return;

    const senderName = profile?.displayName || user.displayName || "Student";

    setSending(true);
    try {
      await sendMessage(
        resolvedSchoolId,
        classId,
        false, // isClub = false
        text.trim(),
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
        <View style={classstyles.header}>
          <Pressable
            onPress={() => router.back()}
            style={classstyles.backButton}
          >
            <Text style={classstyles.backText}>← </Text>
          </Pressable>
          <Text style={classstyles.headerText}>{name ?? "Class Room"}</Text>
        </View>

        {loading ? (
          <View style={classstyles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={classstyles.listContent}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => {
              const isMe = item.authorId === user?.uid;
              return (
                <View
                  style={[
                    classstyles.bubble,
                    isMe ? classstyles.bubbleMe : classstyles.bubbleThem,
                  ]}
                >
                  {!isMe && (
                    <Text style={classstyles.author}>{item.authorName}</Text>
                  )}
                  <Text style={classstyles.messageText}>{item.text}</Text>
                  <Text
                    style={[
                      classstyles.time,
                      isMe ? classstyles.timeMe : classstyles.timeThem,
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
              <View style={classstyles.center}>
                <Text style={classstyles.emptyText}>
                  No messages yet. Say something!
                </Text>
              </View>
            }
          />
        )}

        <View style={classstyles.composer}>
          <TextInput
            style={classstyles.input}
            placeholder="Message..."
            placeholderTextColor={Colors.muted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[
              classstyles.sendButton,
              (!text.trim() || sending) && classstyles.sendButtonDisabled,
            ]}
            onPress={submit}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={classstyles.sendButtonText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
