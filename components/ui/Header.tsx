import BackButton from "@/components/ui/BackButton";
import { classstyles } from "@/constants/styles";
import React from "react";
import { Text, View } from "react-native";

type Props = {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
  style?: any;
};

export default function Header({
  title,
  left,
  right,
  showBack = true,
  style,
}: Props) {
  return (
    <View style={[classstyles.header, style]}>
      <View style={{ width: 40 }}>
        {left ?? (showBack ? <BackButton /> : null)}
      </View>

      <Text style={classstyles.headerText} numberOfLines={1}>
        {title}
      </Text>

      <View style={{ width: 40, alignItems: "flex-end" }}>{right ?? null}</View>
    </View>
  );
}
