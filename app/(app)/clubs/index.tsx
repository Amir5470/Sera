import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { useClubs } from "../../../hooks/useClubs";
import { useProfile } from "../../../hooks/useProfile";
import { leaveClass } from "../../../lib/classes";

export default function Clubs() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { clubs, loading } = useClubs(profile?.schoolId, user?.uid);
  const router = useRouter();

  const [selectedClub, setSelectedClub] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    if (!selectedClub || !user || !profile?.schoolId) return;
    setLeaving(true);
    await leaveClass(user.uid, profile.schoolId, selectedClub.id, true);
    setLeaving(false);
    setSelectedClub(null);
  };

  const confirmLeave = () => {
    Alert.alert(
      `Leave ${selectedClub?.name}?`,
      "You will no longer have access to this club's chat.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: handleLeave },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Clubs & Groups</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(app)/clubs/[clubId]",
                  params: {
                    clubId: item.id,
                    name: item.name,
                    schoolId: profile?.schoolId,
                  },
                } as any)
              }
              onLongPress={() =>
                setSelectedClub({ id: item.id, name: item.name })
              }
              delayLongPress={400}
            >
              <View style={styles.emojiContainer}>
                <Text style={styles.emojiText}>{item.emoji || "🤝"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>
                  {item.teacher && item.teacher !== "Unknown"
                    ? `Advisor: ${item.teacher}`
                    : "Group Chat"}
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Clubs Found</Text>
              <Text style={styles.emptySub}>
                Clubs from your schedule will automatically appear here once
                scanned.
              </Text>
            </View>
          }
        />
      )}

      {/* Long-press action sheet */}
      <Modal
        visible={!!selectedClub}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedClub(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setSelectedClub(null)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selectedClub?.name}</Text>
            <Pressable
              style={[styles.sheetAction, styles.sheetActionDestructive]}
              onPress={confirmLeave}
              disabled={leaving}
            >
              {leaving ? (
                <ActivityIndicator color="#FF4444" size="small" />
              ) : (
                <Text style={styles.sheetActionTextDestructive}>
                  Leave Club
                </Text>
              )}
            </Pressable>
            <Pressable
              style={styles.sheetAction}
              onPress={() => setSelectedClub(null)}
            >
              <Text style={styles.sheetActionText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 40,
  },
  center: { marginTop: 50 },
  header: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.text,
    marginBottom: 24,
  },

  card: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiText: { fontSize: 22 },
  name: { color: Colors.text, fontWeight: "800", fontSize: 17 },
  sub: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  chevron: { color: Colors.muted, fontSize: 18, fontWeight: "600" },

  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySub: {
    color: Colors.muted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  sheetAction: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: "center",
  },
  sheetActionDestructive: {
    backgroundColor: "rgba(255,68,68,0.1)",
  },
  sheetActionText: { color: Colors.text, fontWeight: "600", fontSize: 15 },
  sheetActionTextDestructive: {
    color: "#FF4444",
    fontWeight: "700",
    fontSize: 15,
  },
});
