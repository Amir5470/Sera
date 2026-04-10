import { classstyles } from "@/constants/styles";
import React from "react";
import { Text, View } from "react-native";
import BackButton from "./BackButton";

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
        <BackButton></BackButton>
      </View>

      <Text style={classstyles.headerText} numberOfLines={1}>
        {title}
      </Text>

      <View style={{ width: 40, alignItems: "flex-end" }}>{right ?? null}</View>
    </View>
  );
}
