import { useHeaderHeight } from "@react-navigation/elements";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { uploadImageToCloudinary } from "../../../lib/cloudinary";
import { sanitizeText } from "../../../lib/inputSanitizer";
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
  const [attachmentLocal, setAttachmentLocal] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const listRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();
  const router = useRouter();

  const submit = async () => {
    if (!text.trim() && !attachmentLocal) return;
    if (!user || !resolvedSchoolId || !classId) return;

    let cleaned: string;
    try {
      cleaned = sanitizeText(text, 1000);
    } catch (e: any) {
      Alert.alert("Invalid message", e.message || "Message not allowed.");
      return;
    }

    const senderName = profile?.displayName || user.displayName || "Student";

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
        classId,
        false, // isClub = false
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
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{
                        width: 240,
                        height: 140,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                      resizeMode="cover"
                    />
                  ) : null}
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
        <View style={classstyles.composer}>
          <TextInput
            style={classstyles.input}
            placeholder="Message..."
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
                classstyles.sendButton,
                ((!text.trim() && !attachmentLocal) || sending) &&
                  classstyles.sendButtonDisabled,
              ]}
              onPress={submit}
              disabled={(!text.trim() && !attachmentLocal) || sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={classstyles.sendButtonText}>Send</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
