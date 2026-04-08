import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/colors";
import { PressableScale } from "./animated-helpers";

const TOUR_KEY = "tour:completed";

const STEPS = [
  {
    title: "Feed",
    text: "See school posts and join conversations. Tap a post to view replies.",
  },
  {
    title: "Schedules",
    text: "View today's schedule, set the active bell schedule, and vote for the day.",
  },
  {
    title: "Classes",
    text: "Open class rooms to chat with classmates and view period times.",
  },
  {
    title: "Clubs",
    text: "Find your clubs and group chats — long-press to leave a club.",
  },
  {
    title: "Settings",
    text: "Edit your profile, manage account settings, and log out here.",
  },
];

export default function TourGuide({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose?: () => void;
}) {
  const [index, setIndex] = useState(0);

  const finish = async () => {
    try {
      await AsyncStorage.setItem(TOUR_KEY, "1");
    } catch {
      // ignore
    }
    onClose?.();
  };

  const skip = async () => {
    // Skip should also prevent future automatic plays
    await finish();
  };

  const next = () => {
    if (index + 1 >= STEPS.length) {
      finish();
    } else setIndex(index + 1);
  };

  const prev = () => setIndex(Math.max(0, index - 1));

  if (!visible) return null;

  const step = STEPS[index];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome to Sera</Text>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>

          <View style={styles.controls}>
            <Pressable onPress={skip} style={styles.skip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <View style={{ flexDirection: "row" }}>
              {index > 0 ? (
                <PressableScale style={styles.button} onPress={prev}>
                  <Text style={styles.buttonText}>Back</Text>
                </PressableScale>
              ) : null}
              <PressableScale style={styles.buttonPrimary} onPress={next}>
                <Text style={styles.buttonPrimaryText}>
                  {index + 1 >= STEPS.length ? "Finish" : "Next"}
                </Text>
              </PressableScale>
            </View>
          </View>
          <View style={styles.progressRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i <= index ? styles.dotActive : undefined]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  stepTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  text: {
    color: Colors.muted,
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  controls: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skip: { padding: 8 },
  skipText: { color: Colors.muted },
  button: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    marginLeft: 8,
  },
  buttonText: { color: Colors.text, fontWeight: "700" },
  buttonPrimary: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  buttonPrimaryText: { color: "#fff", fontWeight: "800" },
  progressRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  dotActive: { backgroundColor: Colors.primary },
});
