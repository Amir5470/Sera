import { PressableScale } from "@/components/animated-helpers";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";

const width = Dimensions.get("window").width;

export default function MoreIndex() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme === "light" ? "#fff" : Colors.background },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>More...</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/pomodoro" as any)}
          >
            <View style={styles.left}>
              <Ionicons
                name="stopwatch-outline"
                size={80}
                color={Colors.primary}
              />
              <Text style={styles.label}>Pomodoro Timer</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/study-tools" as any)}
          >
            <View style={styles.left}>
              <Ionicons name="book-outline" size={80} color={Colors.primary} />
              <Text style={styles.label}>Study Tools</Text>
            </View>
          </PressableScale>
        </View>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/campus-resources" as any)}
          >
            <View style={styles.left}>
              <Ionicons
                name="school-outline"
                size={80}
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
          >
            <View style={styles.left}>
              <Ionicons name="time-outline" size={80} color={Colors.primary} />
              <Text style={styles.label}>Community Service</Text>
            </View>
          </PressableScale>
        </View>
      </View>
    </ScrollView>
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
