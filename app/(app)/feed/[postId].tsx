import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
    PressableScale,
    SlideUpView,
} from "../../../components/animated-helpers";
import { Colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { useFeed } from "../../../hooks/useFeed";
import { useProfile } from "../../../hooks/useProfile";

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
      <PressableScale style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </PressableScale>
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
});
