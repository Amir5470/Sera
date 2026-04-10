import Header from "@/components/ui/Header";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CampusResourcesScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme === "light" ? "#fff" : Colors.background },
      ]}
    >
      <View style={styles.container}>
        <Header title="Campus Resources" />
        <Text style={styles.subtitle}>Quick access to campus info.</Text>

        <View style={{ marginTop: 18 }}>
          <Text style={{ color: Colors.muted }}>• Campus Map</Text>
          <Text style={{ color: Colors.muted, marginTop: 8 }}>
            • Dining / Menus
          </Text>
          <Text style={{ color: Colors.muted, marginTop: 8 }}>
            • Transportation
          </Text>
          <Text style={{ color: Colors.muted, marginTop: 8 }}>
            • Emergency Contacts
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
