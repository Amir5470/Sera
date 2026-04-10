import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import promptDoNotDisturb from "../lib/pomodoroService";

type Mode = "work" | "break";

export default function usePomodoro() {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<Mode>("work");
  const [workSeconds, setWorkSeconds] = useState(25 * 60);
  const [breakSeconds, setBreakSeconds] = useState(5 * 60);
  const [secondsLeft, setSecondsLeft] = useState(workSeconds);
  const [totalSeconds, setTotalSeconds] = useState(workSeconds);

  const intervalRef = useRef<number | null>(null);
  const scheduledNotificationRef = useRef<string | null>(null);

  const percent =
    totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  useEffect(() => {
    setSecondsLeft(workSeconds);
    setTotalSeconds(workSeconds);
  }, [workSeconds]);

  useEffect(() => {
    // Ensure Android channel exists for high-priority alerts
    if (Platform.OS === "android") {
      (async () => {
        try {
          const Notifications = await import("expo-notifications");
          await Notifications.setNotificationChannelAsync("pomodoro", {
            name: "Pomodoro Alerts",
            importance: Notifications.AndroidImportance
              ? Notifications.AndroidImportance.MAX
              : 5,
            vibrationPattern: [0, 250, 250, 250],
            sound: "default",
          });
        } catch (e) {
          // ignore missing native module in non-native environments
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      if (intervalRef.current == null) {
        intervalRef.current = setInterval(() => {
          setSecondsLeft((s) => {
            if (s <= 1) {
              // finish
              handleFinish();
              return 0;
            }
            return s - 1;
          });
        }, 1000) as unknown as number;
      }
    } else {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  async function scheduleEndNotification(seconds: number, title: string) {
    try {
      const Notifications = await import("expo-notifications");
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) {
        await Notifications.requestPermissionsAsync();
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: title,
          // fall back to numeric priority if enums missing
          priority:
            Notifications.AndroidNotificationPriority?.MAX ??
            Notifications.AndroidNotificationPriority ??
            5,
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        } as any,
      });
      scheduledNotificationRef.current = id;
      return id;
    } catch (e) {
      return null;
    }
  }

  async function start(wSeconds?: number, bSeconds?: number) {
    if (wSeconds) setWorkSeconds(wSeconds);
    if (bSeconds) setBreakSeconds(bSeconds);

    // if provided new workSeconds use that else keep existing
    const startSeconds = wSeconds ?? workSeconds;

    // prompt user to silence notifications / enable DND
    promptDoNotDisturb().catch(() => {});

    // schedule notification for when this timer completes to ensure delivery even if app closed
    await scheduleEndNotification(startSeconds, "Break Time!");

    setMode("work");
    setTotalSeconds(startSeconds);
    setSecondsLeft(startSeconds);
    setIsRunning(true);
  }

  function pause() {
    setIsRunning(false);
  }

  function reset() {
    setIsRunning(false);
    setMode("work");
    setSecondsLeft(workSeconds);
    setTotalSeconds(workSeconds);
    if (scheduledNotificationRef.current) {
      const notificationId = scheduledNotificationRef.current;
      import("expo-notifications").then((Notifications) => {
        Notifications.cancelScheduledNotificationAsync(notificationId).catch(
          () => {},
        );
      });
      scheduledNotificationRef.current = null;
    }
  }

  async function handleFinish() {
    // stop current interval briefly while we swap modes
    setIsRunning(false);
    // when work finishes, we want a "Break Time!" high priority notification —
    // we've already scheduled one at start, but also ensure immediate fire if needed.
    try {
      const Notifications = await import("expo-notifications");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: mode === "work" ? "Break Time!" : "Focus Time!",
          body: "",
          sound: "default",
        },
        trigger: null,
      });
    } catch (e) {}

    // cancel any previously scheduled end-notification to avoid duplicates
    if (scheduledNotificationRef.current) {
      try {
        const Notifications = await import("expo-notifications");
        await Notifications.cancelScheduledNotificationAsync(
          scheduledNotificationRef.current,
        );
      } catch (e) {}
      scheduledNotificationRef.current = null;
    }

    // switch modes
    if (mode === "work") {
      setMode("break");
      setTotalSeconds(breakSeconds);
      setSecondsLeft(breakSeconds);
      // schedule next (optional) notification to mark end of break
      await scheduleEndNotification(breakSeconds, "Focus Time!");
      // resume running for break period
      setIsRunning(true);
    } else {
      setMode("work");
      setTotalSeconds(workSeconds);
      setSecondsLeft(workSeconds);
      await scheduleEndNotification(workSeconds, "Break Time!");
      setIsRunning(true);
    }
  }

  return { secondsLeft, isRunning, mode, start, pause, reset, percent };
}
