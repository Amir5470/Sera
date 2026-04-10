import Header from "@/components/ui/Header";
import { Colors } from "@/constants/colors";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuickProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { profile } = useProfile();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme === "light" ? "#fff" : Colors.background },
      ]}
    >
      <View style={styles.container}>
        <Header title="Quick Profile" />
        <Text style={styles.subtitle}>A quick snapshot of your profile.</Text>

        <View style={{ marginTop: 18 }}>
          <Text style={{ color: Colors.text, fontWeight: "600" }}>
            {profile?.displayName}
          </Text>
          <Text style={{ color: Colors.muted, marginTop: 6 }}>
            {profile?.grade}
          </Text>

          <View style={{ marginTop: 16 }}>
            <Button
              title="Edit Profile"
              onPress={() => router.push("/settings/edit-profile" as any)}
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
});
