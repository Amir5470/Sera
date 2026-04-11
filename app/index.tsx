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
  // 1. Start HUGE in dark mode so the orange of the logo fills the entire screen.
  // For light mode, start at a much smaller scale so an initial translateY is visible.
  const initialScale = theme === "light" ? 1.4 : 100;
  const initialTranslate = theme === "light" ? 80 : 0;
  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(initialTranslate);

  useEffect(() => {
    // Fade in quickly so we don't see a white flash
    opacity.value = withTiming(1, { duration: 150 });

    // 2. Animate down to normal size
    scale.value = withTiming(1, {
      duration: theme === "light" ? 900 : 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Custom smooth curve
    });

    // If in light mode, start slightly lower and animate up to center
    // animate translateY to center
    translateY.value = withTiming(0, {
      duration: theme === "light" ? 900 : 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    return;
  }, [opacity, scale, translateY, theme]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
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
        source={
          theme === "light"
            ? require("../assets/images/Sera-Logo-Transparent-Btext.png")
            : require("../assets/images/Sera-Logo-Transparent-Wtext.png")
        }
        style={[localStyles.logo, animatedStyle]}
        resizeMode="contain"
      />
    </View>
  );
}
