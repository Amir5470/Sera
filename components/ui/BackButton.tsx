import { PressableScale } from "@/components/animated-helpers";
import { classstyles } from "@/constants/styles";
import { useRouter } from "expo-router";
import React from "react";
import { Text } from "react-native";

type Props = {
  onPress?: () => void;
  label?: string;
};

export default function BackButton({ onPress, label = "Back" }: Props) {
  const router = useRouter();

  return (
    <PressableScale
      onPress={onPress ?? (() => router.back())}
      style={classstyles.backButton}
    >
      <Text style={classstyles.backText}>{label}</Text>
    </PressableScale>
  );
}
