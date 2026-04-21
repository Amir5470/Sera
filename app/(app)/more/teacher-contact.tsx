import { PressableScale } from "@/components/animated-helpers";
import GradientBackground from "@/components/GradientBackground";
import { Colors } from "@/constants/colors";
import { clubstyles } from "@/constants/styles";
import { useAuth } from "@/hooks/useAuth";
import { useClassRooms } from "@/hooks/useClassRooms";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { db } from "@/lib/firebase";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function TeacherContactPage() {
  const { theme } = useTheme();
  const styles = getStyles(theme === "light");
  const { user } = useAuth();
  const { profile } = useProfile();
  const { classRooms } = useClassRooms(profile?.schoolId, user?.uid);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const contacts = classRooms || [];

  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(
    null,
  );
  const [emailInput, setEmailInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const openEmail = (email?: string, subject?: string) => {
    if (!email) return;
    const url = `mailto:${email}?subject=${encodeURIComponent(subject || "")}`;
    Linking.openURL(url).catch(() => {});
  };

  const startAddEmail = (classId: string) => {
    setSelectedClassId(classId);
    setEmailInput("");
    setModalVisible(true);
  };

  const saveEmail = async () => {
    if (!profile?.schoolId || !selectedClassId) return;
    const e = (emailInput || "").trim();
    if (!e || !e.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const classRef = doc(
        db,
        "schools",
        profile.schoolId,
        "classes",
        selectedClassId,
      );
      await updateDoc(classRef, { teacherEmail: e });
      setModalVisible(false);
      setSelectedClassId(null);
      setEmailInput("");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save email");
    } finally {
      setSaving(false);
    }
  };

  const render = ({ item }: any) => (
    <GradientBackground
      colors={
        theme === "light"
          ? (Colors as any).cardGradient
          : (Colors as any).cardGradient
      }
      style={styles.card}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.class}>{item.name}</Text>
        <Text style={styles.teacher}>{item.teacher || "Unknown"}</Text>
      </View>
      {item.teacherEmail ? (
        <PressableScale
          style={styles.button}
          onPress={() =>
            openEmail(item.teacherEmail, `Question about ${item.name}`)
          }
        >
          <Text style={styles.buttonText}>Email</Text>
        </PressableScale>
      ) : (
        <PressableScale
          style={[styles.button, { backgroundColor: Colors.background }]}
          onPress={() => startAddEmail(item.id)}
        >
          <Text style={[styles.buttonText, { color: Colors.muted }]}>
            Add Email
          </Text>
        </PressableScale>
      )}
    </GradientBackground>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={clubstyles.header}>
        <Pressable onPress={() => router.back()} style={clubstyles.backButton}>
          <Text style={clubstyles.backText}>←</Text>
        </Pressable>
        <View>
          <Text style={clubstyles.headerText} numberOfLines={1}>
            Teacher Contacts
          </Text>
        </View>
      </View>
      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        renderItem={render}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No classes found.</Text>}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={Platform.OS === "android"}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { paddingTop: Math.max(insets.top, StatusBar.currentHeight || 0) },
          ]}
          edges={["top", "bottom"]}
        >
          <Text style={styles.header}>Add Teacher Email</Text>
          <TextInput
            placeholder="teacher@example.com"
            placeholderTextColor={Colors.muted}
            style={styles.input}
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <PressableScale style={styles.button} onPress={saveEmail}>
              <Text style={styles.buttonText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.button, { backgroundColor: Colors.background }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.buttonText, { color: Colors.muted }]}>
                Cancel
              </Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (light: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, marginTop: -30 },
    modalContainer: {
      flex: 1,
      backgroundColor: Colors.background,
      padding: 16,
    },
    header: {
      fontSize: 24,
      fontWeight: "800",
      color: Colors.text,
      padding: 16,
    },
    card: {
      backgroundColor: light ? Colors.background2 : Colors.card,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    class: { fontSize: 16, fontWeight: "700", color: Colors.text },
    teacher: { color: Colors.muted, marginTop: 4 },
    button: { backgroundColor: Colors.primary, padding: 10, borderRadius: 8 },
    buttonText: { color: "#fff", fontWeight: "700" },
    input: {
      backgroundColor: light ? Colors.background2 : Colors.card,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 10,
      color: Colors.text,
    },
    empty: { color: Colors.muted, textAlign: "center", marginTop: 24 },
  });
