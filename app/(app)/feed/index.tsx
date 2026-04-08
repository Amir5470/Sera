import { PressableScale } from "@/components/animated-helpers";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/useFeed";
import { useProfile } from "@/hooks/useProfile";
import { useReplies } from "@/hooks/useReplies";
import { successNotification } from "@/lib/haptics";
import { addReply, createPost, deletePost, reportPost } from "@/lib/posts";
import { useRouter } from "expo-router";
import { useState } from "react";
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

type PostCardProps = {
  post: any;
  schoolId: string;
  userId: string;
  displayName: string;
};

function PostCard({ post, schoolId, userId, displayName }: PostCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const { replies } = useReplies(expanded ? schoolId : undefined, post.id);
  const isAuthor = post.authorId === userId;
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deletePost(schoolId, post.id);
      successNotification();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not delete post.");
    }
  };

  const handleReport = async () => {
    try {
      const res = await reportPost(schoolId, post.id, userId, post.text);
      if (res.deleted) {
        Alert.alert(
          "Post removed",
          res.reason === "ai"
            ? "Removed by moderation."
            : "Removed after reports.",
        );
      } else {
        Alert.alert("Thanks", "Your report was submitted.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to report post.");
    }
  };

  const handleCopy = async () => {
    try {
      // Prefer web clipboard when available
      if (
        typeof navigator !== "undefined" &&
        (navigator as any).clipboard?.writeText
      ) {
        await (navigator as any).clipboard.writeText(post.text || "");
        Alert.alert("Copied", "Post text copied to clipboard.");
        return;
      }

      // Native fallback: show the post text so user can copy manually
      Alert.alert("Copy Post", post.text || "");
    } catch (e) {
      Alert.alert("Error", "Could not copy text.");
    }
  };

  const openPostMenu = () => {
    setConfirmDelete(false);
    setMenuVisible(true);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await addReply(schoolId, post.id, replyText.trim(), displayName, userId);
    setReplyText("");
    setSending(false);
  };

  return (
    <PressableScale
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(app)/feed/[postId]",
          params: { postId: post.id },
        } as any)
      }
    >
      <View style={styles.postHeader}>
        <Text style={styles.author}>{post.authorName}</Text>
        <View style={styles.postActions}>
          <PressableScale style={styles.menuButton} onPress={openPostMenu}>
            <Text style={styles.menuButtonText}>⋯</Text>
          </PressableScale>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable style={styles.menuContainer} onPress={() => {}}>
            {!confirmDelete ? (
              <>
                <Text style={styles.menuTitle}>Post</Text>
                <Text
                  style={styles.menuText}
                  numberOfLines={4}
                  ellipsizeMode="tail"
                >
                  {post.text}
                </Text>

                <View style={styles.menuActions}>
                  <PressableScale
                    style={styles.menuActionButton}
                    onPress={async () => {
                      await handleCopy();
                      setMenuVisible(false);
                    }}
                  >
                    <Text style={styles.menuActionText}>Copy</Text>
                  </PressableScale>

                  <PressableScale
                    style={styles.menuActionButton}
                    onPress={async () => {
                      await handleReport();
                      setMenuVisible(false);
                    }}
                  >
                    <Text style={styles.menuActionText}>Report</Text>
                  </PressableScale>

                  {isAuthor && (
                    <PressableScale
                      style={[styles.menuActionButton, styles.menuDestructive]}
                      onPress={() => setConfirmDelete(true)}
                    >
                      <Text
                        style={[
                          styles.menuActionText,
                          styles.menuDestructiveText,
                        ]}
                      >
                        Delete
                      </Text>
                    </PressableScale>
                  )}
                </View>

                <PressableScale
                  style={[styles.menuActionButton, styles.menuClose]}
                  onPress={() => setMenuVisible(false)}
                >
                  <Text style={styles.menuActionText}>Cancel</Text>
                </PressableScale>
              </>
            ) : (
              <>
                <Text style={styles.menuTitle}>Confirm Delete</Text>
                <Text style={styles.menuText}>
                  This will permanently delete the post.
                </Text>
                <View style={styles.menuActions}>
                  <PressableScale
                    style={[styles.menuActionButton, styles.menuClose]}
                    onPress={() => setConfirmDelete(false)}
                  >
                    <Text style={styles.menuActionText}>Cancel</Text>
                  </PressableScale>
                  <PressableScale
                    style={[styles.menuActionButton, styles.menuDestructive]}
                    onPress={async () => {
                      await handleDelete();
                      setMenuVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.menuActionText,
                        styles.menuDestructiveText,
                      ]}
                    >
                      Delete
                    </Text>
                  </PressableScale>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Text style={styles.postText}>{post.text}</Text>

      <View style={styles.postFooter}>
        <Text style={styles.time}>
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <PressableScale
          style={styles.replyToggleButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.replyToggle}>
            {expanded ? "Hide replies" : "View Replies"}
          </Text>
        </PressableScale>
      </View>

      {expanded && (
        <View style={styles.repliesContainer}>
          {replies.map((reply) => (
            <View key={reply.id} style={styles.reply}>
              <Text style={styles.replyAuthor}>{reply.authorName}</Text>
              <Text style={styles.replyText}>{reply.text}</Text>
              <Text style={styles.replyTime}>
                {new Date(reply.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
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
            <PressableScale
              style={[
                styles.replyButton,
                (!replyText.trim() || sending) && styles.replyButtonDisabled,
              ]}
              onPress={submitReply}
              disabled={!replyText.trim() || sending}
            >
              <Text style={styles.replyButtonText}>↑</Text>
            </PressableScale>
          </View>
        </View>
      )}
    </PressableScale>
  );
}

export default function FeedScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { posts, loading } = useFeed(profile?.schoolId);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    if (!text.trim() || !user || !profile?.schoolId) return;
    setPosting(true);
    await createPost(
      profile.schoolId,
      text.trim(),
      profile.displayName ?? "Student",
      user.uid,
    );
    successNotification();
    setText("");
    setPosting(false);
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
          style={styles.input}
          placeholder="What's happening at school?"
          placeholderTextColor={Colors.muted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <PressableScale
          style={[
            styles.button,
            (!text.trim() || posting) && styles.buttonDisabled,
          ]}
          onPress={submit}
          disabled={!text.trim() || posting}
        >
          <Text style={styles.buttonText}>Post</Text>
        </PressableScale>
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
            <Text style={styles.empty}>No posts yet. Be the first!</Text>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 40, paddingHorizontal: 16, paddingBottom: 12 },
  headerText: { color: Colors.text, fontSize: 28, fontWeight: "700" },
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
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, gap: 6 },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: { color: Colors.primary, fontWeight: "600", fontSize: 14 },
  postActions: { flexDirection: "row", gap: 8 },
  deleteButton: { paddingHorizontal: 8, paddingVertical: 4 },
  deleteText: { color: "rgba(255,80,80,0.8)", fontSize: 12 },
  menuButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  menuButtonText: { color: Colors.primary, fontSize: 22, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: Colors.card,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuTitle: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  menuText: {
    color: Colors.text,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  menuActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  menuActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.background,
    minWidth: 90,
    alignItems: "center",
  },
  menuActionText: { color: Colors.text, fontWeight: "700" },
  menuDestructive: { backgroundColor: Colors.card },
  menuDestructiveText: { color: "rgba(255,80,80,0.95)" },
  menuClose: { marginTop: 12, backgroundColor: Colors.background },
  postText: { color: Colors.text, fontSize: 15, lineHeight: 21 },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  time: { color: Colors.muted, fontSize: 12 },
  replyToggle: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
  repliesContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    gap: 10,
  },
  reply: {
    borderRadius: 12,
    backgroundColor: Colors.background,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  replyAuthor: { color: Colors.primary, fontWeight: "600" },
  replyText: { color: Colors.text, fontSize: 14 },
  replyTime: { color: Colors.muted, fontSize: 12 },
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
  },
  replyButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  replyButtonDisabled: { opacity: 0.5 },
  replyButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  empty: {
    color: Colors.muted,
    textAlign: "center",
    marginTop: 40,
  },
  replyToggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#1B1730",
    alignSelf: "flex-start",
  },
  replyToggleText: {
    color: "#fff",
    fontSize: 14,
  },
});
