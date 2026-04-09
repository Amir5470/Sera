import { PressableScale } from "@/components/animated-helpers";
import SendButton from "@/components/ui/SendButton";
import { Colors } from "@/constants/colors";
import { classstyles } from "@/constants/styles";
import { useAuth } from "@/hooks/useAuth";
import { Post, useFeed } from "@/hooks/useFeed";
import { useProfile } from "@/hooks/useProfile";
import { useReplies } from "@/hooks/useReplies";
import { useTheme } from "@/hooks/useTheme";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { successNotification } from "@/lib/haptics";
import {
  addReply,
  createEventPost,
  createPost,
  deletePost,
  reportPost,
  respondToEventInvite,
} from "@/lib/posts";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function PostCard({
  post,
  schoolId,
  userId,
  displayName,
}: {
  post: Post;
  schoolId: string;
  userId: string;
  displayName: string;
}) {
  const { theme } = useTheme();
  const { replies } = useReplies(schoolId, post.id);
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [responding, setResponding] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme === "light" ? "#FFFFFF" : Colors.card,
          borderRadius: 12,
          padding: 14,
          gap: 6,
        },
        postHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        author: { color: Colors.primary, fontWeight: "600", fontSize: 14 },
        postText: {
          color: theme === "light" ? "#0B1020" : Colors.text,
          fontSize: 15,
          lineHeight: 21,
        },
        postFooter: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 4,
        },
        time: { color: Colors.muted, fontSize: 12 },
        replyToggle: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
        replyComposer: {
          marginTop: 10,
          flexDirection: "row",
          gap: 10,
          alignItems: "flex-end",
        },
        replyInput: {
          flex: 1,
          minHeight: 40,
          color: Colors.text,
          fontSize: 14,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 12,
          padding: 10,
          backgroundColor: Colors.background,
        },
        replyButton: {
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: Colors.primary,
          justifyContent: "center",
          alignItems: "center",
        },
        replyButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
      }),
    [theme],
  );

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await addReply(schoolId, post.id, replyText.trim(), displayName, userId);
      setReplyText("");
    } catch {
      Alert.alert("Error", "Could not add reply.");
    } finally {
      setSending(false);
    }
  };

  const handleInviteResponse = async (status: "accepted" | "declined") => {
    if (!post.event) return;
    setResponding(true);
    try {
      await respondToEventInvite(schoolId, post.id, userId, post.event, status);
      successNotification();
      Alert.alert(
        status === "accepted" ? "Added to Calendar" : "Event Declined",
      );
    } catch {
      Alert.alert("Error", "Could not update your response.");
    } finally {
      setResponding(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(schoolId, post.id);
    } catch {
      Alert.alert("Error", "Could not delete post.");
    }
  };

  const handleReport = async () => {
    try {
      await reportPost(schoolId, post.id, userId, post.text);
      Alert.alert("Reported", "Thank you for your report.");
    } catch {
      Alert.alert("Error", "Could not report post.");
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <Text style={styles.author}>{post.authorName}</Text>
        <Pressable onPress={() => setMenuVisible(true)}>
          <Text
            style={{ color: Colors.primary, fontSize: 22, fontWeight: "700" }}
          >
            ⋯
          </Text>
        </Pressable>
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      {post.type === "event" && post.event ? (
        <View
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            backgroundColor: "rgba(249,115,22,0.06)",
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          {post.imageUrl ? (
            <Image
              source={{ uri: post.imageUrl }}
              style={{
                width: "100%",
                height: 140,
                borderRadius: 8,
                marginBottom: 8,
              }}
              resizeMode="cover"
            />
          ) : null}
          <Text style={{ color: Colors.text, fontWeight: "800" }}>
            {post.event.name}
          </Text>
          <Text style={{ color: Colors.muted, marginTop: 4 }}>
            {post.event.dateKey} • {post.event.startTime} - {post.event.endTime}
          </Text>
          {!post.authorId || post.authorId !== userId ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <PressableScale
                style={{
                  flex: 1,
                  backgroundColor: Colors.background,
                  padding: 10,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={() => handleInviteResponse("declined")}
              >
                <Text style={{ color: Colors.text }}>Decline</Text>
              </PressableScale>
              <PressableScale
                style={{
                  flex: 1,
                  backgroundColor: Colors.primary,
                  padding: 10,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={() => handleInviteResponse("accepted")}
              >
                <Text style={{ color: "#fff" }}>Accept</Text>
              </PressableScale>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.postFooter}>
        <Text style={styles.time}>
          {new Date(post.createdAt).toLocaleString()}
        </Text>
        <PressableScale
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: Colors.primary,
          }}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={{ color: "#fff", fontSize: 14 }}>
            {expanded ? "Hide replies" : "View Replies"}
          </Text>
        </PressableScale>
      </View>

      {expanded && (
        <View style={{ marginTop: 10, gap: 10 }}>
          {replies.map((r) => (
            <View
              key={r.id}
              style={{
                backgroundColor: Colors.background,
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: Colors.primary, fontWeight: "600" }}>
                {r.authorName}
              </Text>
              <Text style={{ color: Colors.text }}>{r.text}</Text>
            </View>
          ))}

          <View style={styles.replyComposer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              placeholderTextColor={Colors.muted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <PressableScale style={styles.replyButton} onPress={submitReply}>
              <Text style={styles.replyButtonText}>↑</Text>
            </PressableScale>
          </View>
        </View>
      )}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            elevation: 3,
          }}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              backgroundColor: theme === "light" ? "#FFFFFF" : Colors.card,
              padding: 22,
              borderRadius: 18,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              marginHorizontal: 20,
            }}
          >
            {!confirmDelete ? (
              <>
                <Text
                  style={{
                    color: Colors.primary,
                    fontSize: 18,
                    fontWeight: "800",
                    textAlign: "center",
                  }}
                >
                  Post
                </Text>
                <Text
                  style={{
                    color: Colors.text,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                  numberOfLines={4}
                  ellipsizeMode="tail"
                >
                  {post.text || post.event?.name}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    marginTop: 16,
                    gap: 12,
                  }}
                >
                  <PressableScale
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      backgroundColor: Colors.background,
                      minWidth: 90,
                      alignItems: "center",
                    }}
                    onPress={async () => {
                      await navigator.clipboard?.writeText?.(post.text || "");
                      setMenuVisible(false);
                    }}
                  >
                    <Text style={{ color: Colors.text, fontWeight: "700" }}>
                      Copy
                    </Text>
                  </PressableScale>

                  <PressableScale
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      backgroundColor: Colors.background,
                      minWidth: 90,
                      alignItems: "center",
                    }}
                    onPress={async () => {
                      await handleReport();
                      setMenuVisible(false);
                    }}
                  >
                    <Text style={{ color: Colors.text, fontWeight: "700" }}>
                      Report
                    </Text>
                  </PressableScale>

                  {post.authorId === userId && (
                    <PressableScale
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 18,
                        borderRadius: 12,
                        backgroundColor: Colors.background,
                        minWidth: 90,
                        alignItems: "center",
                      }}
                      onPress={() => setConfirmDelete(true)}
                    >
                      <Text
                        style={{
                          color: "rgba(255,80,80,0.95)",
                          fontWeight: "700",
                        }}
                      >
                        Delete
                      </Text>
                    </PressableScale>
                  )}
                </View>

                <PressableScale
                  style={{
                    marginTop: 12,
                    backgroundColor: Colors.background,
                    padding: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                  onPress={() => setMenuVisible(false)}
                >
                  <Text style={{ color: Colors.text, fontWeight: "700" }}>
                    Cancel
                  </Text>
                </PressableScale>
              </>
            ) : (
              <>
                <Text
                  style={{
                    color: Colors.primary,
                    fontSize: 18,
                    fontWeight: "800",
                    textAlign: "center",
                  }}
                >
                  Confirm Delete
                </Text>
                <Text
                  style={{
                    color: Colors.text,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  This will permanently delete the post.
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    marginTop: 16,
                    gap: 12,
                  }}
                >
                  <PressableScale
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      backgroundColor: Colors.background,
                      minWidth: 90,
                      alignItems: "center",
                    }}
                    onPress={() => setConfirmDelete(false)}
                  >
                    <Text style={{ color: Colors.text, fontWeight: "700" }}>
                      Cancel
                    </Text>
                  </PressableScale>
                  <PressableScale
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 12,
                      backgroundColor: "rgba(255,80,80,0.95)",
                      minWidth: 90,
                      alignItems: "center",
                    }}
                    onPress={async () => {
                      await handleDelete();
                      setMenuVisible(false);
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Delete
                    </Text>
                  </PressableScale>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function FeedScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme } = useTheme();
  const { posts, loading } = useFeed(profile?.schoolId);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(() => toDateKey(new Date()));
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [eventThumbnailLocal, setEventThumbnailLocal] = useState<null | string>(
    null,
  );
  const [eventUploadingThumbnail, setEventUploadingThumbnail] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme === "light" ? "#FFFFFF" : Colors.background,
        },
        header: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 12 },
        headerText: {
          color: theme === "light" ? "#0B1020" : Colors.text,
          fontSize: 28,
          fontWeight: "700",
        },
        composer: {
          marginHorizontal: 14,
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: theme === "light" ? "#F6F7FB" : Colors.card,
          borderRadius: 12,
          padding: 12,
          gap: 8,
          minHeight: 140,
          marginTop: 4,
        },
        input: {
          color: theme === "light" ? "#0B1020" : Colors.text,
          fontSize: 15,
          minHeight: 120,
          flex: 1,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 12,
          padding: 10,
          backgroundColor: theme === "light" ? "#FFFFFF" : Colors.card,
          textAlignVertical: "top",
        },
        button: {
          backgroundColor: Colors.primary,
          borderRadius: 8,
          paddingVertical: 10,
          alignItems: "center",
        },
        buttonDisabled: { opacity: 0.4 },
        buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
      }),
    [theme],
  );

  const submit = async () => {
    if (!text.trim() || !user || !profile?.schoolId) return;
    setPosting(true);
    try {
      await createPost(
        profile.schoolId,
        text.trim(),
        profile.displayName ?? "Student",
        user.uid,
      );
      successNotification();
      setText("");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not post.");
    } finally {
      setPosting(false);
    }
  };

  const resetEventFields = () => {
    setEventName("");
    setEventDate(toDateKey(new Date()));
    setEventStart("");
    setEventEnd("");
    setEventDetails("");
    setEventMessage("");
    setEventThumbnailLocal(null);
  };

  const submitEventPost = async () => {
    if (!user || !profile?.schoolId) return;
    if (
      !eventName.trim() ||
      !eventDate.trim() ||
      !eventStart.trim() ||
      !eventEnd.trim()
    ) {
      Alert.alert(
        "Required",
        "Add event name, date, start time, and end time.",
      );
      return;
    }
    setPosting(true);
    try {
      let uploadedUrl: string | undefined;
      if (eventThumbnailLocal) {
        setEventUploadingThumbnail(true);
        try {
          uploadedUrl = await uploadImageToCloudinary(eventThumbnailLocal);
        } catch (e) {
          // If upload fails, still allow sharing without image
          console.warn("Thumbnail upload failed:", e);
          Alert.alert(
            "Upload failed",
            "Could not upload thumbnail. Share without image?",
          );
        } finally {
          setEventUploadingThumbnail(false);
        }
      }
      await createEventPost(
        profile.schoolId,
        {
          name: eventName,
          dateKey: eventDate,
          startTime: eventStart,
          endTime: eventEnd,
          details: eventDetails,
        },
        profile.displayName ?? "Student",
        user.uid,
        eventMessage,
        uploadedUrl,
      );
      successNotification();
      resetEventFields();
      setEventModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not share event.");
    } finally {
      setPosting(false);
    }
  };

  const pickThumbnail = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission required",
          "Allow access to photos to add a thumbnail.",
        );
        return;
      }
      const mediaTypes = (ImagePicker as any).MediaType?.Images;
      const pickerOptions: any = {
        quality: 0.7,
        allowsEditing: true,
        aspect: [16, 9],
      };
      if (mediaTypes) pickerOptions.mediaTypes = mediaTypes;
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      // Handle both old and new result shapes
      // @ts-expect-error
      const localUri = result?.uri ?? result?.assets?.[0]?.uri;
      // @ts-expect-error
      const cancelled = result?.cancelled ?? result?.canceled ?? false;
      if (!cancelled && localUri) {
        setEventThumbnailLocal(localUri);
      }
    } catch (e) {
      console.warn("Image picker error", e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Feed</Text>
      </View>

      <View style={styles.composer}>
        <TextInput
          style={classstyles.input}
          placeholder="What's happening at school?"
          placeholderTextColor={Colors.muted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <SendButton onPress={submit} disabled={!text.trim() || posting}>
            Post
          </SendButton>
          <SendButton
            onPress={() => setEventModalVisible(true)}
            disabled={posting}
          >
            Share Event
          </SendButton>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              schoolId={profile?.schoolId ?? ""}
              userId={user?.uid ?? ""}
              displayName={profile?.displayName ?? "Student"}
            />
          )}
          ListEmptyComponent={
            <Text
              style={{
                color: Colors.muted,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              No posts yet. Be the first!
            </Text>
          }
        />
      )}

      <Modal
        visible={eventModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEventModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              backgroundColor: Colors.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{ color: Colors.text, fontSize: 20, fontWeight: "700" }}
            >
              Share Event
            </Text>
            <TextInput
              style={{
                color: Colors.text,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: Colors.background,
                marginTop: 12,
              }}
              placeholder="Event name"
              placeholderTextColor={Colors.muted}
              value={eventName}
              onChangeText={setEventName}
            />
            <TextInput
              style={{
                color: Colors.text,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: Colors.background,
                marginTop: 8,
              }}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={Colors.muted}
              value={eventDate}
              onChangeText={setEventDate}
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  color: Colors.text,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: Colors.background,
                }}
                placeholder="Start (3:30 PM)"
                placeholderTextColor={Colors.muted}
                value={eventStart}
                onChangeText={setEventStart}
              />
              <TextInput
                style={{
                  flex: 1,
                  color: Colors.text,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: Colors.background,
                }}
                placeholder="End (5:00 PM)"
                placeholderTextColor={Colors.muted}
                value={eventEnd}
                onChangeText={setEventEnd}
              />
            </View>
            <TextInput
              style={{
                color: Colors.text,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: Colors.background,
                marginTop: 8,
                minHeight: 64,
              }}
              placeholder="Event details"
              placeholderTextColor={Colors.muted}
              value={eventDetails}
              onChangeText={setEventDetails}
              multiline
            />
            <TextInput
              style={{
                color: Colors.text,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: Colors.background,
                marginTop: 8,
                minHeight: 64,
              }}
              placeholder="Optional message in feed post"
              placeholderTextColor={Colors.muted}
              value={eventMessage}
              onChangeText={setEventMessage}
              multiline
            />

            {/* Thumbnail picker and preview */}
            <View style={{ marginTop: 12 }}>
              {eventThumbnailLocal ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Image
                    source={{ uri: eventThumbnailLocal }}
                    style={{ width: 120, height: 72, borderRadius: 8 }}
                  />
                  <View style={{ flex: 1 }}>
                    <PressableScale
                      style={{
                        backgroundColor: Colors.background,
                        padding: 10,
                        borderRadius: 8,
                        alignItems: "center",
                      }}
                      onPress={() => setEventThumbnailLocal(null)}
                    >
                      <Text style={{ color: Colors.text, fontWeight: "700" }}>
                        Remove
                      </Text>
                    </PressableScale>
                  </View>
                </View>
              ) : (
                <PressableScale
                  style={{
                    backgroundColor: Colors.background,
                    padding: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                  onPress={pickThumbnail}
                >
                  <Text style={{ color: Colors.primary, fontWeight: "700" }}>
                    Add Thumbnail
                  </Text>
                </PressableScale>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <PressableScale
                style={{
                  flex: 1,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                  backgroundColor: Colors.background,
                }}
                onPress={() => {
                  setEventModalVisible(false);
                  resetEventFields();
                }}
              >
                <Text style={{ color: Colors.text, fontWeight: "700" }}>
                  Cancel
                </Text>
              </PressableScale>
              <PressableScale
                style={{
                  flex: 1,
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: "center",
                  backgroundColor: Colors.primary,
                }}
                onPress={submitEventPost}
                disabled={posting}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Share</Text>
              </PressableScale>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
