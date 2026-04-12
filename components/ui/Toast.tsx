import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, Colors } from "@/hooks/useTheme";

export default function Toast({ message }: { message: string }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.toast} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const getStyles = (theme: "dark" | "light") =>
  StyleSheet.create({
    toast: {
      position: "absolute",
      bottom: 48,
      alignSelf: "center",
      backgroundColor: Colors.card,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      elevation: 6,
    },
    text: { color: Colors.text, fontWeight: "600", fontSize: 14 },
  });