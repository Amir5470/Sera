import { PressableScale } from "@/components/animated-helpers";
import { classstyles } from "@/constants/styles";
import React from "react";
import { Text } from "react-native";

type Props = {
  onPress?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
};

export default function SendButton({ onPress, disabled, children }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      style={[
        classstyles.sendButton,
        disabled && classstyles.sendButtonDisabled,
      ]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={typeof children === "string" ? String(children) : "Send"}
    >
      <Text style={classstyles.sendButtonText}>{children}</Text>
    </PressableScale>
  );
}
