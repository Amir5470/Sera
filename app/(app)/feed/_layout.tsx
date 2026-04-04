import { Stack } from "expo-router";
import { Colors } from "../../../constants/colors";

export default function FeedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_bottom",
        animationDuration: 300,
        gestureEnabled: true,
      }}
    />
  );
}
