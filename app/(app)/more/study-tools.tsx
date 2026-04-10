import Header from "@/components/ui/Header";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StudyToolsScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme === "light" ? "#fff" : Colors.background },
      ]}
    >
      <View style={styles.container}>
        <Header title="Study Tools" />
        <Text style={styles.subtitle}>Small utilities to help you study.</Text>

        <View style={{ marginTop: 18 }}>
          <Text style={{ color: Colors.muted }}>
            - GPA / Grade tracker (coming soon)
          </Text>
          <Text style={{ color: Colors.muted, marginTop: 8 }}>
            - Quick Notes
          </Text>
          <Text style={{ color: Colors.muted, marginTop: 8 }}>
            - Calculator
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 10 },
  subtitle: { color: Colors.muted, marginTop: 6 },
});
