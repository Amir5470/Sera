import Header from "@/components/ui/Header";
import { Colors } from "@/constants/colors";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useTheme } from "@/hooks/useTheme";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccessibilityScreen() {
  const { theme } = useTheme();
  const {
    largeText,
    reduceMotion,
    colorblindMode,
    setLargeText,
    setReduceMotion,
    setColorblindMode,
  } = useAccessibility();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme === "light" ? "#fff" : Colors.background },
      ]}
    >
      <View style={styles.container}>
        <Header title="Accessibility" />
        <Text style={styles.subtitle}>Adjust accessibility preferences.</Text>

        <View style={{ marginTop: 18 }}>
          <View style={styles.row}>
            <Text style={{ color: Colors.text }}>Big text</Text>
            <Switch
              value={largeText}
              onValueChange={async (v) => {
                try {
                  await setLargeText(v);
                } catch {
                  Alert.alert("Error", "Failed to update setting");
                }
              }}
            />
          </View>

          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={{ color: Colors.text }}>Reduce motion</Text>
            <Switch
              value={reduceMotion}
              onValueChange={async (v) => {
                try {
                  await setReduceMotion(v);
                } catch {
                  Alert.alert("Error", "Failed to update setting");
                }
              }}
            />
          </View>

          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={{ color: Colors.text }}>Colorblind friendly</Text>
            <Switch
              value={colorblindMode}
              onValueChange={async (v) => {
                try {
                  await setColorblindMode(v);
                } catch {
                  Alert.alert("Error", "Failed to update setting");
                }
              }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 10 },
  subtitle: { color: Colors.muted, marginTop: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
});
