import { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../hooks/useTheme";

const { width } = Dimensions.get("window");

export default function Splash() {
  const { theme } = useTheme();
  // 1. Start HUGE so the orange of the logo fills the entire screen
  const scale = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in quickly so we don't see a white flash
    opacity.value = withTiming(1, { duration: 150 });

    // 2. Animate down to normal size
    scale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Custom smooth curve
    });

    return;
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme === "light" ? "#FFFFFF" : "#0D0A1A",
          justifyContent: "center",
          alignItems: "center",
        },
        logo: {
          width: width * 0.6,
          height: width * 0.6,
        },
      }),
    [theme],
  );

  return (
    <View style={localStyles.container}>
      <Animated.Image
        source={require("../assets/images/Sera-Logo-Transparent-Wtext.png")}
        style={[localStyles.logo, animatedStyle]}
        resizeMode="contain"
      />
    </View>
  );
}
