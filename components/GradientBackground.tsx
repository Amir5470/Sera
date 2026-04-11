import React from "react";
import { View, ViewStyle } from "react-native";

type Props = {
  colors: string[];
  style?: ViewStyle | Array<ViewStyle>;
  children?: React.ReactNode;
  start?: [number, number];
  end?: [number, number];
};

export default function GradientBackground({
  colors,
  style,
  children,
  start = [0, 0],
  end = [1, 0],
}: Props) {
  let LinearGradient: any = null;
  try {
    // lazy-require using eval('require') to avoid Metro static analysis
    // which tries to resolve the module at bundle time even if it's optional.
    // eslint-disable-next-line no-eval,@typescript-eslint/no-unsafe-call
    const r: any = eval("require");
    const mod = r("expo-linear-gradient");
    LinearGradient = mod?.LinearGradient ?? mod;
  } catch (e) {
    LinearGradient = null;
  }

  if (LinearGradient) {
    return (
      // @ts-ignore - runtime import
      <LinearGradient colors={colors} start={start} end={end} style={style}>
        {children}
      </LinearGradient>
    );
  }

  // fallback to plain View using first color
  return (
    <View style={[{ backgroundColor: colors?.[0] ?? "transparent" }, style]}>
      {children}
    </View>
  );
}
