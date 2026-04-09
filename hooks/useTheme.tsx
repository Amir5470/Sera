import { applyTheme, Colors, palettes } from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Animated, DevSettings, Easing } from "react-native";

const STORAGE_KEY = "sera:theme";

type ThemeContextValue = {
  theme: "dark" | "light";
  toggle: () => Promise<void>;
  animatedValue: Animated.Value;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const animatedValue = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
          applyTheme(stored);
          setTheme(stored);
          animatedValue.setValue(stored === "light" ? 1 : 0);
        }
      } catch (e) {}
    })();
  }, [animatedValue]);

  const toggle = async () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}

    Animated.timing(animatedValue, {
      toValue: next === "light" ? 1 : 0,
      useNativeDriver: false,
      duration: 600,
      easing: Easing.out(Easing.cubic),
    }).start();
    // On many platforms modules create StyleSheets at module load time. In
    // order to ensure theme changes take effect immediately across files
    // that still use module-level styles, trigger an automatic reload in
    // development where available. This avoids requiring the user to
    // manually reload the app to see theme changes.
    try {
      if (typeof DevSettings?.reload === "function") {
        // Only reload automatically in development; on iOS/Android this
        // will do a fast JS reload. Avoid forcing reload in production.
        if (__DEV__) DevSettings.reload();
      }
    } catch (e) {
      // ignore failures
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle, animatedValue }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export { Colors, palettes };
