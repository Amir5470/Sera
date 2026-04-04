import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

export default function Step2() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.title}>Profile photo</Text>
      <Text style={styles.subtitle}>
        Profile photos aren't available yet — we'll add them in a future update.
      </Text>

      <PressableScale
        style={styles.button}
        onPress={() => router.push("/(onboarding)/step3" as any)}
      >
        <Text style={styles.buttonText}>Next →</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 80,
  },
  progress: { flexDirection: "row", gap: 8, marginBottom: 48 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.card },
  dotActive: { backgroundColor: Colors.primary },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 15,
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
