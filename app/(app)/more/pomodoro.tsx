import PomodoroTimer from "@/components/ui/PomodoroTimer";
import { Colors } from "@/constants/colors";
import { classstyles } from "@/constants/styles";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PomodoroScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme === "light" ? "#fff" : Colors.background },
      ]}
    >
      <View style={styles.container}>
        <View style={classstyles.header}>
          <Pressable
            onPress={() => router.back()}
            style={classstyles.backButton}
          >
            <Text style={classstyles.backText}>← </Text>
          </Pressable>
          <Text style={classstyles.headerText}>{"Pomodoro Timer"}</Text>
        </View>
        <Text style={styles.subtitle}>
          Focus on your tasks with the Pomodoro technique.
        </Text>

        <View style={{ marginTop: 18 }}>
          <PomodoroTimer />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 10, marginTop: -30 },
  header: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
  },
  subtitle: { color: Colors.muted, marginTop: 6 },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
});
