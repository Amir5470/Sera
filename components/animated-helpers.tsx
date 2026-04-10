import { useAccessibility } from "@/hooks/useAccessibility";
import * as Haptics from "expo-haptics";
import { useEffect, type ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Reanimated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

export function usePressScale() {
  const pressed = useSharedValue(0);
  const { reduceMotion } = useAccessibility();

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {
        transform: [{ scale: 1 }],
        shadowOpacity: 0,
        shadowRadius: 2,
        elevation: 1,
        boxShadow: `0px 2px 4px rgba(0,0,0,0)`,
      };
    }

    return {
      transform: [
        {
          scale: withTiming(pressed.value ? 0.97 : 1, {
            duration: 120,
            easing: Easing.out(Easing.quad),
          }),
        },
      ],
      shadowOpacity: withTiming(pressed.value ? 0.18 : 0, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      }),
      shadowRadius: withTiming(pressed.value ? 8 : 2, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      }),
      elevation: pressed.value ? 6 : 1,
      // Provide boxShadow string for web (react-native-web deprecates shadow* props)
      boxShadow: `0px ${pressed.value ? 8 : 2}px ${pressed.value ? 16 : 4}px rgba(0,0,0,${pressed.value ? 0.18 : 0})`,
    };
  });

  const onPressIn = () => {
    pressed.value = 1;
    if (!reduceMotion) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onPressOut = () => {
    pressed.value = 0;
  };

  return { animatedStyle, onPressIn, onPressOut };
}

export function PressableScale(
  props: PressableProps & { style?: StyleProp<ViewStyle>; children: ReactNode },
) {
  const { style, onPressIn, onPressOut, ...rest } = props;
  const {
    animatedStyle,
    onPressIn: internalPressIn,
    onPressOut: internalPressOut,
  } = usePressScale();

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        internalPressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        internalPressOut();
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}

export function FadeInView({
  children,
  style,
  delay = 0,
  duration = 200,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
}) {
  const opacity = useSharedValue(0);
  const { reduceMotion } = useAccessibility();

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }

    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.exp),
    });
  }, [duration, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={[style, animatedStyle]}>{children}</Reanimated.View>
  );
}

export function SlideUpView({
  children,
  style,
  delay = 0,
  duration = 250,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
}) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const { reduceMotion } = useAccessibility();

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }

    translateY.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.exp),
    });
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.exp),
    });
  }, [duration, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={[style, animatedStyle]}>{children}</Reanimated.View>
  );
}
export function ParallaxBackground({
  scrollY,
  style,
  children,
}: {
  scrollY: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 200], [0, -2]),
      },
      {
        translateX: interpolate(scrollY.value, [0, 200], [0, 2]),
      },
    ],
  }));

  return (
    <Reanimated.View style={[style, animatedStyle]}>{children}</Reanimated.View>
  );
}
