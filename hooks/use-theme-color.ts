import { Colors } from "@/constants/colors";
import { useTheme } from "./useTheme";

export const useThemeColor = (
  props: { light?: string; dark?: string } = {},
  colorName: keyof typeof Colors = "text",
) => {
  const { theme } = useTheme();
  const override = theme === "light" ? props.light : props.dark;
  if (override) return override;
  // Fallback to Colors map
  // @ts-ignore
  return Colors[colorName] ?? Colors.text;
};

export default useThemeColor;
