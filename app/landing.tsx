import { useProfile } from "@/hooks/useProfile";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  PanResponder,
  Animated as RNAnimated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Reanimated, {
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { FadeInView, PressableScale } from "../components/animated-helpers";
import GradientBackground from "../components/GradientBackground";
import { Colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { useBellSchedules } from "../hooks/useBellSchedules";
import { useClassRooms } from "../hooks/useClassRooms";
import { useTheme } from "../hooks/useTheme";
import { successNotification } from "../lib/haptics";
import computeNextClass from "../lib/scheduleUtils";

const { width, height } = Dimensions.get("window");

function BackgroundPattern({ scrollY }: { scrollY: SharedValue<number> }) {
  const dots = [];
  const spacing = 35;
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil((height * 0.6) / spacing);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: scrollY.value * -0.01 },
      { translateX: scrollY.value * 0.01 },
    ],
  }));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <View
          key={`${r}-${c}`}
          style={{
            position: "absolute",
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: Colors.muted,
            top: r * spacing + 20,
            left: c * spacing + 20,
          }}
        />,
      );
    }
  }

  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      {dots}
    </Reanimated.View>
  );
}

function NextClassBadge({
  schoolId,
  userId,
}: {
  schoolId?: string;
  userId?: string;
}) {
  const { theme } = useTheme();
  const { classRooms } = useClassRooms(schoolId, userId);
  const { activeSchedule } = useBellSchedules(schoolId);
  const [displayClass, setDisplayClass] = useState<{
    label: string;
    cls: any;
  } | null>(null);
  const [currentKey, setCurrentKey] = useState("");
  const flip = useSharedValue(0);

  const nextClass = useMemo(
    () => computeNextClass(classRooms, activeSchedule),
    [classRooms, activeSchedule],
  );

  useEffect(() => {
    const nextKey = nextClass
      ? `${nextClass.label}-${nextClass.cls.id ?? nextClass.cls.name}`
      : "";

    if (!nextClass || nextKey === currentKey) {
      if (!displayClass) setDisplayClass(nextClass);
      return;
    }

    flip.value = withTiming(
      90,
      {
        duration: 175,
        easing: Easing.inOut(Easing.ease),
      },
      () => {
        runOnJS(setDisplayClass)(nextClass);
        runOnJS(setCurrentKey)(nextKey);
        flip.value = withTiming(0, {
          duration: 175,
          easing: Easing.inOut(Easing.ease),
        });
      },
    );
  }, [currentKey, displayClass, flip, nextClass]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${flip.value}deg` }],
    backfaceVisibility: "hidden",
  }));
  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          backgroundColor: Colors.card,
          borderRadius: 14,
          padding: 14,
          marginBottom: 0,
          borderWidth: 1,
          borderColor: Colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        badgeLabel: {
          color: Colors.primary,
          fontWeight: "700",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        badgeClass: {
          color: Colors.text,
          fontWeight: "600",
          fontSize: 15,
          flex: 1,
        },
        badgeTime: {
          color: Colors.muted,
          fontSize: 12,
        },
      }),
    [theme],
  );

  if (!displayClass) {
    return (
      <Text style={{ color: Colors.muted }}>No upcoming classes found</Text>
    );
  }

  return (
    <Reanimated.View style={[badgeStyle]}>
      <GradientBackground
        colors={
          theme === "light"
            ? (Colors as any).cardGradient
            : (Colors as any).cardGradient
        }
        style={localStyles.badge}
      >
        <Text style={localStyles.badgeLabel}>{displayClass.label}</Text>
        <Text style={localStyles.badgeClass}>
          {displayClass.cls.emoji || "📖"} {displayClass.cls.name}
        </Text>
        {displayClass.cls.startTime && (
          <Text style={localStyles.badgeTime}>
            {displayClass.cls.startTime} – {displayClass.cls.endTime}
          </Text>
        )}
      </GradientBackground>
    </Reanimated.View>
  );
}

function UnlockSlider({ onUnlock }: { onUnlock: () => void }) {
  const { theme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const thumbSize = 56;
  const trackPadding = 4;
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const startX = useRef(0);
  const lastHapticBracket = useRef(0);

  const maxTranslate = Math.max(
    0,
    containerWidth - thumbSize - trackPadding * 2,
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startX.current = 0;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextX = Math.max(
            0,
            Math.min(maxTranslate, startX.current + gestureState.dx),
          );
          translateX.setValue(nextX);

          const progress = nextX / maxTranslate;
          const bracket =
            progress > 0.85
              ? 3
              : progress > 0.7
                ? 2.5
                : progress > 0.6
                  ? 2
                  : progress > 0.5
                    ? 1.5
                    : progress > 0.35
                      ? 1
                      : 0;

          if (bracket !== lastHapticBracket.current) {
            lastHapticBracket.current = bracket;

            if (bracket === 1) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else if (bracket === 2) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else if (bracket === 3) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const nextX = Math.max(
            0,
            Math.min(maxTranslate, startX.current + gestureState.dx),
          );
          if (nextX >= maxTranslate * 0.85) {
            RNAnimated.timing(translateX, {
              toValue: maxTranslate,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              onUnlock();
            });
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            RNAnimated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            lastHapticBracket.current = 0;
          }
        },
      }),
    [maxTranslate, onUnlock, translateX],
  );

  return (
    <View
      style={useMemo(() => ({ width: "100%" }), [])}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {/** recreate slider styles when theme changes */}
      {(() => {
        const local = StyleSheet.create({
          sliderTrack: {
            width: "100%",
            height: 64,
            borderRadius: 999,
            backgroundColor: Colors.card,
            justifyContent: "center",
            paddingHorizontal: 12,
            overflow: "hidden",
          },
          sliderLabel: {
            position: "absolute",
            width: "100%",
            textAlign: "center",
            color: Colors.muted,
            fontSize: 15,
            letterSpacing: 0.3,
            left: 25,
          },
          sliderThumb: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.primary,
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            left: 4,
            top: 4,
            shadowColor: Colors.primary,
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 4,
            boxShadow:
              theme === "light"
                ? `0px 8px 16px ${Colors.primary}`
                : `0px 8px 16px rgba(0,0,0,0.3)`,
          },
          thumbText: {
            color: Colors.text,
            fontSize: 22,
            fontWeight: "700",
          },
        });

        return (
          <View style={local.sliderTrack}>
            <Text style={local.sliderLabel}>Slide to unlock</Text>
            <RNAnimated.View
              style={[local.sliderThumb, { transform: [{ translateX }] }]}
              {...panResponder.panHandlers}
            >
              <Text style={local.thumbText}>→</Text>
            </RNAnimated.View>
          </View>
        );
      })()}
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const { theme } = useTheme();

  const stylesMemo = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: Colors.background,
          overflow: "hidden",
          height: "100%",
        },
        orangeBlob: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.35,
          backgroundColor: Colors.primary,
          elevation: 0,
        },
        darkCard: {
          flex: 1,
          minHeight: height * 0.88,
          marginTop: height * 0.12,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 100,
          backgroundColor: Colors.background,
          paddingHorizontal: 28,
          paddingTop: 30,
          paddingBottom: 40,
          overflow: "hidden",
          shadowColor: theme === "light" ? "#ffffff" : "#000000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 1,
          shadowRadius: 30,
          elevation: 8,
          boxShadow: `0px -4px 20px rgba(0,0,0,0.12)`,
        },
        contentArea: { flex: 1 },
        logo: { width: 130, height: 120, marginBottom: 24 },
        messageBox: { flex: 1, justifyContent: "flex-end", marginBottom: 32 },
        welcomeText: {
          fontSize: 32,
          fontWeight: "800",
          color: Colors.text,
          marginBottom: 10,
          lineHeight: 40,
        },
        subtitleText: { fontSize: 16, color: Colors.muted, lineHeight: 24 },
        bottomArea: { width: "100%" },
        button: {
          backgroundColor: Colors.primary,
          padding: 18,
          borderRadius: 16,
          width: "100%",
          alignItems: "center",
          marginBottom: 14,
        },
        buttonText: { color: Colors.text, fontWeight: "700", fontSize: 16 },
        secondary: { width: "100%", padding: 16, alignItems: "center" },
        secondaryText: { color: Colors.muted, fontSize: 16 },
      }),
    [theme],
  );

  const cardTranslateY = useSharedValue(height * 0.35);
  const contentOpacity = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    cardTranslateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });
    contentOpacity.value = withTiming(1, {
      duration: 600,
    });
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const greetingName = profile?.displayName?.trim()?.split(" ")[0] || "Amir";
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${greetingName}`;
    if (hour < 17) return `Good afternoon, ${greetingName}`;
    if (hour < 21) return `Good evening, ${greetingName}`;
    return `Good night, ${greetingName}`;
  }, [greetingName]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleUnlock = () => {
    successNotification();
    router.replace("/(app)/feed");
  };

  return (
    <View style={stylesMemo.container}>
      {/* Orange cutout background */}
      <View style={stylesMemo.orangeBlob} />

      {/* Dark card that covers most of the screen */}
      <Reanimated.View style={[stylesMemo.darkCard, animatedCardStyle]}>
        <BackgroundPattern scrollY={scrollY} />

        <Reanimated.View style={[stylesMemo.contentArea, animatedContentStyle]}>
          {/* Logo */}
          <Image
            source={
              theme === "light"
                ? require("../assets/images/Sera-Logo-Transparent-Btext.png")
                : require("../assets/images/Sera-Logo-Transparent-Wtext.png")
            }
            style={stylesMemo.logo}
            resizeMode="contain"
          />

          {/* Greeting */}
          <View style={stylesMemo.messageBox}>
            {user ? (
              <FadeInView style={{ gap: 18, width: "100%" }}>
                <Text style={stylesMemo.welcomeText}>{greetingText}</Text>
                <NextClassBadge
                  schoolId={profile?.schoolId}
                  userId={user.uid}
                />
              </FadeInView>
            ) : (
              <FadeInView style={{ gap: 12, width: "100%" }}>
                <Text style={stylesMemo.welcomeText}>Welcome to Sera</Text>
                <Text style={stylesMemo.subtitleText}>
                  Get started with a school-wide app experience.
                </Text>
              </FadeInView>
            )}
          </View>

          {/* Actions */}
          {!user ? (
            <View style={stylesMemo.bottomArea}>
              <PressableScale
                style={stylesMemo.button}
                onPress={() => router.push("/(auth)/sign-up")}
              >
                <Text style={stylesMemo.buttonText}>Get Started</Text>
              </PressableScale>
              <PressableScale
                style={stylesMemo.secondary}
                onPress={() => router.push("/(auth)/sign-in")}
              >
                <Text style={stylesMemo.secondaryText}>Log In</Text>
              </PressableScale>
            </View>
          ) : (
            <View style={stylesMemo.bottomArea}>
              <UnlockSlider onUnlock={handleUnlock} />
            </View>
          )}
        </Reanimated.View>
      </Reanimated.View>
    </View>
  );
}
