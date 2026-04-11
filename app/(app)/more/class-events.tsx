import { PressableScale } from "@/components/animated-helpers";
import GradientBackground from "@/components/GradientBackground";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClassEventsPage() {
  const { theme } = useTheme();
  const styles = getStyles(theme === "light");

  const [events, setEvents] = useState(
    [] as { id: string; title: string; cls?: string; notes?: string }[],
  );
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [cls, setCls] = useState("");
  const [notes, setNotes] = useState("");

  const add = () => {
    if (!title.trim()) return;
    setEvents((s) => [
      {
        id: `${Date.now()}`,
        title: title.trim(),
        cls: cls.trim(),
        notes: notes.trim(),
      },
      ...s,
    ]);
    setTitle("");
    setCls("");
    setNotes("");
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
        <Text style={styles.sub}>{item.cls || "All classes"}</Text>
        {item.notes ? <Text style={styles.sub}>{item.notes}</Text> : null}
      </View>
    </GradientBackground>
  );

  return (
    <Screen title="Class Events" contentStyle={{ padding: 12 }}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Class Events</Text>
        <PressableScale style={styles.add} onPress={() => setVisible(true)} accessibilityRole="button" accessibilityLabel="Add event">
          <Text style={styles.addText}>+ Add</Text>
        </PressableScale>
      </View>

      <FlatList
        data={events}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No events yet.</Text>}
      />

      <Modal visible={visible} animationType="slide" accessibilityViewIsModal onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
          <Text style={styles.header}>New Event</Text>
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
            placeholder="Notes"
            placeholderTextColor={Colors.muted}
            style={[styles.input, { height: 100 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <PressableScale style={styles.save} onPress={add}>
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
        </Screen>
      </Modal>
    </Screen>
  );
}

const getStyles = (light: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    headerRow: {
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    header: { fontSize: 24, fontWeight: "800", color: Colors.text },
    add: { padding: 8 },
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
    empty: { color: Colors.muted, textAlign: "center", padding: 16 },
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
