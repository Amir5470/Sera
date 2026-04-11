import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";

import { useAccessibility } from "@/hooks/useAccessibility";
import { useThemeColor } from "../hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const { largeText } = useAccessibility();
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const adjustForLarge = (s?: StyleProp<TextStyle>): StyleProp<TextStyle> => {
    if (!largeText) return s as StyleProp<TextStyle>;
    const grow = (st?: TextStyle) => {
      if (!st) return st;
      const copy = { ...st } as TextStyle;
      if (typeof copy.fontSize === "number") copy.fontSize = copy.fontSize + 4;
      if (typeof copy.lineHeight === "number")
        copy.lineHeight = copy.lineHeight + 4;
      return copy;
    };
    if (Array.isArray(s))
      return s.map((x) => (typeof x === "object" ? grow(x as TextStyle) : x));
    return grow(s as TextStyle) as StyleProp<TextStyle>;
  };

  return (
    <Text
      style={adjustForLarge([
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ])}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
