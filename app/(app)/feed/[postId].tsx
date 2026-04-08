import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PressableScale,
  SlideUpView,
} from "../../../components/animated-helpers";
import { Colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { useFeed } from "../../../hooks/useFeed";
import { useProfile } from "../../../hooks/useProfile";
import { useReplies } from "../../../hooks/useReplies";
import { addReply } from "../../../lib/posts";

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { profile } = useProfile();
  const { user } = useAuth();
  const { posts, loading } = useFeed(profile?.schoolId);

  const post = useMemo(
    () => posts.find((item) => item.id === postId),
    [posts, postId],
  );

  const { replies } = useReplies(profile?.schoolId, postId as string);
  const [replyText, setReplyText] = useState("");

  const submitReply = async () => {
    if (!replyText.trim() || !profile?.schoolId || !user) return;
    await addReply(
      profile.schoolId,
      postId as string,
      replyText.trim(),
      profile.displayName || "Student",
      user.uid,
    );
    setReplyText("");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Post not found.</Text>
        <PressableScale style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back to Feed</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <SlideUpView style={styles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Post</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.postHeader}>
            <Text style={styles.author}>{post.authorName}</Text>
            <Text style={styles.time}>
              {new Date(post.createdAt).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.postText}>{post.text}</Text>
        </View>

        {/* Replies */}
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          {replies.map((r) => (
            <View key={r.id} style={styles.reply}>
              <Text style={styles.replyAuthor}>{r.authorName}</Text>
              <Text style={styles.replyText}>{r.text}</Text>
              <Text style={styles.replyTime}>
                {new Date(r.createdAt).toLocaleTimeString()}
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
                !replyText.trim() && styles.replyButtonDisabled,
              ]}
              onPress={submitReply}
              disabled={!replyText.trim()}
            >
              <Text style={styles.replyButtonText}>↑</Text>
            </PressableScale>
          </View>
        </View>

        <PressableScale style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </PressableScale>
      </SafeAreaView>
    </SlideUpView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 40,
  },
  headerRow: { marginBottom: 16 },
  headerText: { color: Colors.text, fontSize: 28, fontWeight: "800" },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  author: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  time: {
    color: Colors.muted,
    fontSize: 12,
    flexShrink: 1,
    textAlign: "right",
  },
  postText: { color: Colors.text, fontSize: 16, lineHeight: 24 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  empty: {
    color: Colors.muted,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  backText: { color: Colors.text, fontWeight: "700" },
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
});
