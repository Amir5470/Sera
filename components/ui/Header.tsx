import { classstyles } from "@/constants/styles";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "../animated-helpers";

type Props = {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
  style?: any;
  onPress?: () => void;
};

export default function Header({
  title,
  left,
  right,
  showBack = true,
  style,
  onPress,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top || (Platform.OS === "ios" ? 0 : 10);
  return (
    <View style={[classstyles.header, { paddingTop: topPadding }, style]}>
      <View style={{ width: 40 }}>
        {showBack ? (
          <PressableScale
            onPress={onPress ?? (() => router.back())}
            style={classstyles.backButton}
          >
            <Text style={classstyles.backText}>←</Text>
          </PressableScale>
        ) : null}
      </View>

      <Text style={classstyles.headerText} numberOfLines={1}>
        {title}
      </Text>

      <View style={{ width: 40, alignItems: "flex-end" }}>{right ?? null}</View>
    </View>
  );
}
