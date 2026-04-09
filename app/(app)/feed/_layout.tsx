import { Stack } from "expo-router";
import { useTheme } from "../../../hooks/useTheme";

export default function FeedLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme === "light" ? "#FFFFFF" : "#0D0A1A",
        },
        animation: "slide_from_bottom",
        animationDuration: 300,
        gestureEnabled: true,
      }}
    />
  );
}
