import { useHeaderHeight } from "@react-navigation/elements";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { uploadImageToCloudinary } from "../../../lib/cloudinary";
import { db } from "../../../lib/firebase";
import safeOnSnapshot from "../../../lib/firestoreHelpers";
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
  const [attachmentLocal, setAttachmentLocal] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
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

    const unsub = safeOnSnapshot(
      memberRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          // User is no longer a member, redirect to clubs list
          router.replace("/(app)/clubs" as any);
        }
      },
      (err) => {
        console.error("club member snapshot error:", err);
        // If permission denied, kick user back to clubs list as a safe fallback
        router.replace("/(app)/clubs" as any);
      },
    );

    return unsub;
  }, [user?.uid, resolvedSchoolId, clubId]);

  // 3. Submit Message Logic
  const submit = async () => {
    if (!text.trim() && !attachmentLocal) return;
    if (!user || !resolvedSchoolId || !clubId) return;

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
      let uploadedUrl: string | undefined;
      if (attachmentLocal) {
        setUploadingAttachment(true);
        try {
          uploadedUrl = await uploadImageToCloudinary(attachmentLocal);
        } catch (e) {
          console.warn("Attachment upload failed", e);
          Alert.alert("Upload failed", "Could not upload attachment.");
        } finally {
          setUploadingAttachment(false);
        }
      }
      await sendMessage(
        resolvedSchoolId,
        clubId,
        true, // isClub = true
        cleaned,
        senderName,
        user.uid,
        uploadedUrl,
      );
      setText("");
      setAttachmentLocal(null);
      // Small timeout to allow the keyboard/list to adjust before scrolling
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error("Send failed:", e);
    } finally {
      setSending(false);
    }
  };

  const pickAttachment = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission required",
          "Allow access to photos to add an attachment.",
        );
        return;
      }
      const mediaTypes = (ImagePicker as any).MediaType?.Images;
      const pickerOptions: any = { quality: 0.8, allowsEditing: true };
      if (mediaTypes) pickerOptions.mediaTypes = mediaTypes;
      const res = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      // support both shapes
      // @ts-expect-error
      const localUri = res?.uri ?? res?.assets?.[0]?.uri;
      // @ts-expect-error
      const cancelled = res?.cancelled ?? res?.canceled ?? false;
      if (!cancelled && localUri) setAttachmentLocal(localUri as string);
    } catch (e) {
      console.warn("Picker error", e);
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
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{
                        width: Math.min(320, width - 80),
                        height: 160,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                      resizeMode="cover"
                    />
                  ) : null}
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

        {/* Attachment preview (rendered above composer to avoid layout squeeze) */}
        {attachmentLocal ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Image
                source={{ uri: attachmentLocal }}
                style={{ width: 120, height: 72, borderRadius: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => setAttachmentLocal(null)}
                  style={{
                    padding: 8,
                    backgroundColor: Colors.background,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: Colors.text, fontWeight: "700" }}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={pickAttachment}
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: Colors.background,
              }}
            >
              <Text style={{ color: Colors.primary, fontWeight: "700" }}>
                Attach
              </Text>
            </Pressable>
            <Pressable
              style={[
                clubstyles.sendButton,
                ((!text.trim() && !attachmentLocal) || sending) &&
                  clubstyles.sendButtonDisabled,
              ]}
              onPress={submit}
              disabled={(!text.trim() && !attachmentLocal) || sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={clubstyles.sendButtonText}>Send</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
