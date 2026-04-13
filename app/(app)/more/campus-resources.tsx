import Header from "@/components/ui/Header";
import Screen from "@/components/ui/Screen";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import { StyleSheet, Text, View } from "react-native";

export default function CampusResourcesScreen() {
  const { theme } = useTheme();

  return (
    <Screen title="Campus Resources" contentStyle={{ padding: 12 }}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 10 },
  subtitle: { color: Colors.muted, marginTop: 6 },
});
