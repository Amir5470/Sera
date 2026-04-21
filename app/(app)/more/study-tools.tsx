import { Colors } from "@/constants/colors";
import { clubstyles } from "@/constants/styles";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StudyToolsScreen() {
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
        <View style={clubstyles.header}>
          <Pressable
            onPress={() => router.back()}
            style={clubstyles.backButton}
          >
            <Text style={clubstyles.backText}>←</Text>
          </Pressable>
          <View>
            <Text style={clubstyles.headerText} numberOfLines={1}>
              Study Tools
            </Text>
          </View>
        </View>
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
  container: { padding: 10, marginTop: -30 },
  subtitle: { color: Colors.muted, marginTop: 6 },
});
