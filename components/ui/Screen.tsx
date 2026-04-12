import React from "react";
import { View, Text, StyleProp, ViewStyle, StyleSheet } from "react-native";
import { classstyles } from "@/constants/styles";
import { useAccessibility } from "@/hooks/useAccessibility";

export default function Screen({
  title,
  children,
  contentStyle,
}: {
  title?: string;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { largeText } = useAccessibility();

  // Apply a text scale multiplier when largeText is enabled
  const textScale = largeText ? 1.18 : 1;

  return (
    <View
      style={classstyles.container}
      accessible
      accessibilityRole={title ? "region" : "none"}
      accessibilityLabel={title ?? undefined}
    >
      <View style={[classstyles.listContent, contentStyle]}>{children}</View>
      {/* Simple inline style adjustment for scaling large text (consumers should
          use relative font sizes where possible). */}
      <StyleSheet>
        {`/* placeholder to indicate where scaling would be applied */`}
      </StyleSheet>
    </View>
  );
}
