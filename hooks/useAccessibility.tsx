import { Colors, applyTheme } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "sera:accessibility";

type AccessibilityState = {
  colorblindMode: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  setColorblindMode: (v: boolean) => Promise<void>;
  setLargeText: (v: boolean) => Promise<void>;
  setReduceMotion: (v: boolean) => Promise<void>;
};

const defaultState: AccessibilityState = {
  colorblindMode: false,
  largeText: false,
  reduceMotion: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setColorblindMode: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLargeText: async () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setReduceMotion: async () => {},
};

const AccessibilityContext = createContext<AccessibilityState>(defaultState);

export const AccessibilityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  const [colorblindMode, setColorblindModeState] = useState(false);
  const [largeText, setLargeTextState] = useState(false);
  const [reduceMotion, setReduceMotionState] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setColorblindModeState(Boolean(parsed.colorblindMode));
          setLargeTextState(Boolean(parsed.largeText));
          setReduceMotionState(Boolean(parsed.reduceMotion));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const persist = async (next: Partial<Record<string, unknown>>) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const merged = { ...parsed, ...next };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      // ignore
    }
  };

  const setColorblindMode = async (v: boolean) => {
    setColorblindModeState(v);
    await persist({ colorblindMode: v });
    try {
      // Apply or revert color adjustments globally (except primary)
      if (v) {
        // Mutate Colors in-place to be more vibrant for non-primary colors
        Object.keys(Colors).forEach((k) => {
          if (k === "primary") return;
          try {
            const val = (Colors as any)[k] as string;
            // simple vibrancy: boost RGB channels slightly, handle hex and rgba
            const vibrate = (c: string) => {
              if (c.startsWith("#") && (c.length === 7 || c.length === 4)) {
                // expand short hex
                const hex =
                  c.length === 4 ? c.replace(/#([0-9a-f])/gi, "#$1$1") : c;
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                const rr = Math.min(255, Math.round(r * 1.15 + 8));
                const gg = Math.min(255, Math.round(g * 1.15 + 8));
                const bb = Math.min(255, Math.round(b * 1.15 + 8));
                return (
                  "#" +
                  [rr, gg, bb]
                    .map((v2) => v2.toString(16).padStart(2, "0"))
                    .join("")
                );
              }

              if (c.startsWith("rgba") || c.startsWith("rgb")) {
                const nums = c.match(/([0-9]+\.?[0-9]*)/g);
                if (!nums) return c;
                const r = Math.min(255, Math.round(Number(nums[0]) * 1.15 + 8));
                const g = Math.min(255, Math.round(Number(nums[1]) * 1.15 + 8));
                const b = Math.min(255, Math.round(Number(nums[2]) * 1.15 + 8));
                if (c.startsWith("rgba")) {
                  const a = Number(nums[3]) ?? 1;
                  return `rgba(${r}, ${g}, ${b}, ${a})`;
                }
                return `rgb(${r}, ${g}, ${b})`;
              }

              return c;
            };

            (Colors as any)[k] = vibrate(val);
          } catch (e) {
            // ignore
          }
        });
      } else {
        // revert palette to current theme
        applyTheme(theme);
      }
    } catch (e) {
      // ignore
    }
  };

  const setLargeText = async (v: boolean) => {
    setLargeTextState(v);
    await persist({ largeText: v });
  };

  const setReduceMotion = async (v: boolean) => {
    setReduceMotionState(v);
    await persist({ reduceMotion: v });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        colorblindMode,
        largeText,
        reduceMotion,
        setColorblindMode,
        setLargeText,
        setReduceMotion,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);

export default useAccessibility;
