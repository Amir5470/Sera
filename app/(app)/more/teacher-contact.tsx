import { PressableScale } from "@/components/animated-helpers";
import GradientBackground from "@/components/GradientBackground";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useClassRooms } from "@/hooks/useClassRooms";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { FlatList, Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TeacherContactPage() {
  const { theme } = useTheme();
  const styles = getStyles(theme === "light");
  const { user } = useAuth();
  const { profile } = useProfile();
  const { classRooms } = useClassRooms(profile?.schoolId, user?.uid);

  const contacts = classRooms || [];

  const openEmail = (email?: string, subject?: string) => {
    if (!email) return;
    const url = `mailto:${email}?subject=${encodeURIComponent(subject || "")}`;
    Linking.openURL(url).catch(() => {});
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
      <PressableScale
        style={styles.button}
        onPress={() =>
          openEmail(item.teacherEmail || "", `Question about ${item.name}`)
        }
      >
        <Text style={styles.buttonText}>Email</Text>
      </PressableScale>
    </GradientBackground>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Text style={styles.header}>Teacher Quick Contact</Text>
      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        renderItem={render}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No classes found.</Text>}
      />
    </SafeAreaView>
  );
}

const getStyles = (light: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
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
    empty: { color: Colors.muted, textAlign: "center", marginTop: 24 },
  });
