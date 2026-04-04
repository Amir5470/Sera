import { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../constants/colors";

const { width } = Dimensions.get("window");

export default function Splash() {
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
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/images/Sera-Logo-Transparent-Wtext.png")}
        style={[styles.logo, animatedStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Ensure this background matches the "orange" or the dark theme of your app
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    // Make the base size reasonable, the 'scale' shared value handles the "bigness"
    width: width * 0.6,
    height: width * 0.6,
  },
});
