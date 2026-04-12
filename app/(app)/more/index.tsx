import Screen from "@/components/ui/Screen";
import { PressableScale } from "@/components/animated-helpers";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const width = Dimensions.get("window").width;

export default function MoreIndex() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <Screen title="More" contentStyle={{ padding: 12 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>More...</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/pomodoro" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open Pomodoro Timer"
          >
            <View style={styles.left}>
              <Ionicons
                name="stopwatch-outline"
                size={60}
                color={Colors.primary}
                accessibilityHidden={false}
              />
              <Text style={styles.label}>Pomodoro Timer</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/study-tools" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open Study Tools"
          >
            <View style={styles.left}>
              <Ionicons name="book-outline" size={60} color={Colors.primary} />
              <Text style={styles.label}>Study Tools</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/campus-resources" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open Campus Resources"
          >
            <View style={styles.left}>
              <Ionicons
                name="school-outline"
                size={60}
                color={Colors.primary}
              />
              <Text style={styles.label}>Campus Resources</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/service-hours" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open Community Service"
          >
            <View style={styles.left}>
              <Ionicons name="time-outline" size={60} color={Colors.primary} />
              <Text style={styles.label}>Community Service</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/exams" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open Exam Deadlines"
          >
            <View style={styles.left}>
              <Ionicons
                name="calendar-outline"
                size={60}
                color={Colors.primary}
              />
              <Text style={styles.label}>Exam Deadlines</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/class-events" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open Class Events"
          >
            <View style={styles.left}>
              <Ionicons
                name="megaphone-outline"
                size={60}
                color={Colors.primary}
              />
              <Text style={styles.label}>Class Events</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/teacher-contact" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open Teacher Quick Contact"
          >
            <View style={styles.left}>
              <Ionicons
                name="mail-open-outline"
                size={60}
                color={Colors.primary}
              />
              <Text style={styles.label}>Teacher Quick Contact</Text>
            </View>
          </PressableScale>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    padding: 16,
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: "hidden",
    width: width * 0.4,
    height: width * 0.4,
  },
  item: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  left: { flexDirection: "column", alignItems: "center", gap: 12 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.text },
  header: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 12 },
  headerText: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
});
