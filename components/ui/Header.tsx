import { classstyles } from "@/constants/styles";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
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
  return (
    <View style={[classstyles.header, style]}>
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
