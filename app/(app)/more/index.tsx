import { PressableScale } from "@/components/animated-helpers";
import Header from "@/components/ui/Header";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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
      <Header title="More" />

      <View style={styles.section}>
        <View style={styles.card}>
          <PressableScale
            style={styles.item}
            onPress={() => router.push("/(app)/more/pomodoro" as any)}
          >
            <View style={styles.left}>
              <Ionicons
                name="stopwatch-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.label}>Pomodoro Timer</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </PressableScale>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: 16 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8 },
  card: { backgroundColor: Colors.card, borderRadius: 12, overflow: "hidden" },
  item: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { fontSize: 16, fontWeight: "600" },
});
