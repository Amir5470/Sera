import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import TourGuide from "../components/tour-guide";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import Splash from "./index";

const SeraTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0D0A1A",
    card: "#0D0A1A",
  },
};

export default function RootLayout() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [splashComplete, setSplashComplete] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const [showTour, setShowTour] = useState(false);

  // Force 2-second minimum splash time
  useEffect(() => {
    const checkTour = async () => {
      try {
        const v = await AsyncStorage.getItem("tour:completed");
        if (!v) setShowTour(true);
      } catch {
        setShowTour(true);
      }
    };
    checkTour();
    const timer = setTimeout(() => {
      setSplashComplete(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait for splash timer AND Firebase to be ready
    if (!splashComplete || authLoading || profileLoading) return;

    const navigate = async () => {
      const currentSegment = segments[0];

      // Where are we?
      const onSplash = currentSegment === undefined; // index.tsx
      const onLanding = currentSegment === "landing";
      const inAuth = currentSegment === "(auth)";
      const inOnboarding = currentSegment === "(onboarding)";
      const inApp = currentSegment === "(app)";

      // RULE 1: If incomplete onboarding, send to onboarding (override everything)
      if (user && !profile?.onboardingComplete) {
        if (!inOnboarding) {
          router.replace("/(onboarding)/step1" as any);
        }
        return;
      }

      // If onboarding is already COMPLETE, don't allow access to onboarding screens
      if (user && profile?.onboardingComplete && inOnboarding) {
        router.replace("/feed" as any);
        return;
      }

      // RULE 2: If on splash, always go to landing next
      if (onSplash) {
        router.replace("/landing" as any);
        return;
      }

      // RULE 3: If logged in but on auth screens, redirect to landing
      if (user && profile?.onboardingComplete && inAuth) {
        router.replace("/landing" as any);
        return;
      }

      // RULE 4: If NOT logged in and trying to access app, send to landing
      if (!user && inApp) {
        router.replace("/landing" as any);
        return;
      }

      // Otherwise, stay where you are
      // Landing page handles its own navigation via slide-to-unlock or buttons
    };

    navigate();
  }, [user, authLoading, profile, profileLoading, segments, splashComplete]);

  return (
    <ThemeProvider value={SeraTheme}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1, backgroundColor: "#0D0A1A" }}>
          {!splashComplete || authLoading || profileLoading ? (
            <Splash />
          ) : (
            <Slot />
          )}
          <TourGuide
            visible={
              showTour && !(!splashComplete || authLoading || profileLoading)
            }
            onClose={() => setShowTour(false)}
          />
        </View>
      </KeyboardAvoidingView>
    </ThemeProvider>
  );
}
