import { PressableScale } from "@/components/animated-helpers";
import GradientBackground from "@/components/GradientBackground";
import { Colors } from "@/constants/colors";
import { clubstyles } from "@/constants/styles";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExamsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useStyles(theme === "light");

  const [exams, setExams] = useState(
    [] as { id: string; title: string; cls?: string; date?: string }[],
  );
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [cls, setCls] = useState("");
  const [date, setDate] = useState("");

  const addExam = () => {
    if (!title.trim()) return;
    setExams((s) => [
      {
        id: `${Date.now()}`,
        title: title.trim(),
        cls: cls.trim(),
        date: date.trim(),
      },
      ...s,
    ]);
    setTitle("");
    setCls("");
    setDate("");
    setVisible(false);
  };

  const renderItem = ({ item }: any) => (
    <GradientBackground
      colors={
        theme === "light"
          ? (Colors as any).cardGradient
          : (Colors as any).cardGradient
      }
      style={styles.card}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.sub}>{item.cls || "Any class"}</Text>
        <Text style={styles.sub}>{item.date || "No date"}</Text>
      </View>
    </GradientBackground>
  );

  const empty = useMemo(
    () => (
      <View style={{ padding: 24 }}>
        <Text style={styles.empty}>No upcoming exams. Tap + to add.</Text>
      </View>
    ),
    [styles.empty],
  );

  return (
    <SafeAreaView style={[styles.container]} edges={["top", "bottom"]}>
      <View style={clubstyles.header}>
        <Pressable onPress={() => router.back()} style={clubstyles.backButton}>
          <Text style={clubstyles.backText}>←</Text>
        </Pressable>
        <View>
          <Text style={clubstyles.headerText} numberOfLines={1}>
            Exam Deadlines
          </Text>
        </View>
      </View>
      <View
        style={{
          padding: 0,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <PressableScale style={styles.add} onPress={() => setVisible(true)}>
          <Text style={styles.addText}>+ Add</Text>
        </PressableScale>
      </View>

      <FlatList
        data={exams}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={empty}
        contentContainerStyle={{ padding: 16 }}
      />

      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
          <Text style={styles.header}>Add Exam</Text>
          <TextInput
            placeholder="Title"
            placeholderTextColor={Colors.muted}
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            placeholder="Class (optional)"
            placeholderTextColor={Colors.muted}
            style={styles.input}
            value={cls}
            onChangeText={setCls}
          />
          <TextInput
            placeholder="Date (e.g. 2026-05-12)"
            placeholderTextColor={Colors.muted}
            style={styles.input}
            value={date}
            onChangeText={setDate}
          />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <PressableScale style={styles.save} onPress={addExam}>
              <Text style={styles.saveText}>Save</Text>
            </PressableScale>
            <PressableScale
              style={[styles.save, { backgroundColor: Colors.background }]}
              onPress={() => setVisible(false)}
            >
              <Text style={[styles.saveText, { color: Colors.muted }]}>
                Cancel
              </Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const useStyles = (light: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, marginTop: -30 },
    headerRow: {
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    header: { fontSize: 24, fontWeight: "800", color: Colors.text },
    add: {
      backgroundColor: light ? Colors.background2 : Colors.card,
      textAlign: "center",
      borderRadius: 12,
      margin: 16,
      padding: 8,
      alignSelf: "flex-start",
      width: "80%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    addText: { color: Colors.primary, fontWeight: "700" },
    card: {
      backgroundColor: light ? Colors.background2 : Colors.card,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    title: { fontSize: 16, fontWeight: "700", color: Colors.text },
    sub: { color: Colors.muted, fontSize: 13, marginTop: 4 },
    empty: { color: Colors.muted, textAlign: "center" },
    modal: { flex: 1, padding: 16, backgroundColor: Colors.background },
    input: {
      backgroundColor: light ? Colors.background2 : Colors.card,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 10,
      color: Colors.text,
    },
    save: { backgroundColor: Colors.primary, padding: 12, borderRadius: 10 },
    saveText: { color: "#fff", fontWeight: "700" },
  });
