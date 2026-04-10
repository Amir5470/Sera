import Header from "@/components/ui/Header";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import { Button, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InviteScreen() {
  const { theme } = useTheme();

  const onShare = async () => {
    try {
      await Share.share({
        message: "Join me on Sera! Download: https://example.com",
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme === "light" ? "#fff" : Colors.background },
      ]}
    >
      <View style={styles.container}>
        <Header title="Invite Friends" />
        <Text style={styles.subtitle}>Share Sera with your friends.</Text>

        <View style={{ marginTop: 18 }}>
          <Button title="Share Invite" onPress={onShare} />
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
