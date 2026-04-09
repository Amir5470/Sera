import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PressableScale } from "../../components/animated-helpers";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { useBellSchedules } from "../../hooks/useBellSchedules";
import { useClassRooms } from "../../hooks/useClassRooms";
import { useProfile } from "../../hooks/useProfile";
import { useTheme } from "../../hooks/useTheme";
import { BellPeriod, voteForSchedule } from "../../lib/bellSchedules";
import { joinOrCreateClass, leaveClass } from "../../lib/classes";
import fetchWithLimit from "../../lib/fetchWithLimit";
import { successNotification } from "../../lib/haptics";
import { sanitizeObjectPayload } from "../../lib/inputSanitizer";

const CLAUDE_MODEL = "claude-3-5-haiku-20241022";
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY!;
const PERIOD_OPTIONS = Array.from({ length: 9 }, (_, i) => {
  const period = i + 1;
  const suffix =
    period === 1 ? "st" : period === 2 ? "nd" : period === 3 ? "rd" : "th";
  return `${period}${suffix}`;
});

const normalizePeriod = (period: string) =>
  period
    .toLowerCase()
    .replace(/period/g, "")
    .replace(/(st|nd|rd|th)/g, "")
    .trim()
    .replace(/^0+/, "");

const getPeriodSortValue = (period: string) => {
  const value = Number.parseInt(normalizePeriod(period), 10);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};

const sortPeriods = (periods: string[]) =>
  [...periods].sort((a, b) => getPeriodSortValue(a) - getPeriodSortValue(b));

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const parseTimeToMinutes = (time?: string) => {
  if (!time) return null;
  const trimmed = time.trim().toLowerCase();
  const match = trimmed.match(/^(\d{1,2})(?:\:(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const meridiem = match[3];

  if (meridiem === "am") {
    if (hours === 12) hours = 0;
  } else if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }

  return hours * 60 + minutes;
};

const hasMeridiem = (time?: string) => !!time?.trim().match(/\b(am|pm)\b/i);

const resolvePeriodWindow = (startTime?: string, endTime?: string) => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  if (start == null || end == null) return null;

  if (end > start) {
    return { start, end };
  }

  // If end is not after start, try interpreting end as the following hour
  // (handles cases like "12:45" → "1:15" where end parses lower numerically).
  // Use a best-effort +12h adjustment rather than requiring both times to omit
  // meridiem markers — this resolves many school-schedule edge cases.
  const adjustedEnd = end + 12 * 60;
  if (adjustedEnd > start) {
    return { start, end: adjustedEnd };
  }

  return null;
};

const formatTimeLabel = (time?: string) => time || "--:--";

const getPeriodProgress = (
  startTime?: string,
  endTime?: string,
  nowMinutes?: number,
) => {
  const window = resolvePeriodWindow(startTime, endTime);

  if (!window || nowMinutes == null) {
    return null;
  }

  const { start, end } = window;

  if (nowMinutes < start) {
    return {
      progress: 0,
      label: `Starts at ${formatTimeLabel(startTime)}`,
      variant: "upcoming" as const,
    };
  }

  if (nowMinutes >= end) {
    return {
      progress: 1,
      label: "Finished",
      variant: "past" as const,
    };
  }

  const progress = (nowMinutes - start) / (end - start);
  return {
    progress: Math.max(0, Math.min(1, progress)),
    label: `Ends at ${formatTimeLabel(endTime)}`,
    variant: "active" as const,
  };
};

interface ScannedClass {
  name: string;
  teacher: string;
  period: string;
  emoji: string;
  startTime?: string;
  endTime?: string;
  type?: "class" | "club";
}

interface PeriodTime {
  period: string;
  startTime: string;
  endTime: string;
}

const uriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetchWithLimit(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const callClaude = async (base64: string, prompt: string) => {
  const response = await fetchWithLimit(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    },
  );
  if (!response.ok) throw new Error(`API ${response.status}`);
  const data = await response.json();
  const raw = data.content[0].text;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found");
  return JSON.parse(raw.substring(start, end + 1));
};

const extractClasses = async (base64: string): Promise<ScannedClass[]> =>
  callClaude(
    base64,
    `Extract all entries from this school schedule image. Determine if each is a regular academic class or extracurricular club.
    Return ONLY a JSON array. Format: [{"name":"Class Name","teacher":"Teacher Name","period":"3rd","emoji":"📚","type":"class"}]
    Use type "class" for academic subjects. Use type "club" for extracurriculars, electives, or activities.`,
  );

const extractTimes = async (base64: string): Promise<PeriodTime[]> =>
  callClaude(
    base64,
    `Extract the bell schedule / period times from this image. Return ONLY a JSON array. Format: [{"period":"1st","startTime":"08:40","endTime":"09:30"}]`,
  );

const mergeTimes = (
  classes: ScannedClass[],
  times: PeriodTime[],
): ScannedClass[] =>
  classes.map((cls) => {
    const normalize = (p: string) =>
      p
        .toLowerCase()
        .replace(/(st|nd|rd|th)/g, "")
        .trim();
    const match = times.find(
      (t) => normalize(t.period) === normalize(cls.period),
    );
    return {
      ...cls,
      startTime: match?.startTime || "",
      endTime: match?.endTime || "",
    };
  });

// ─── New Bell Schedule Creator Modal ────────────────────────────────────────

function NewBellScheduleModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, periods: BellPeriod[]) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const createEmptyPeriodTimes = () =>
    Object.fromEntries(
      PERIOD_OPTIONS.map((period) => [period, { startTime: "", endTime: "" }]),
    ) as Record<string, { startTime: string; endTime: string }>;
  const [selectedPeriods, setSelectedPeriods] =
    useState<string[]>(PERIOD_OPTIONS);
  const [periodTimes, setPeriodTimes] = useState<
    Record<string, { startTime: string; endTime: string }>
  >(createEmptyPeriodTimes);
  const [saving, setSaving] = useState(false);

  const styles = useThemeStyles();

  const updatePeriod = (
    period: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setPeriodTimes((current) => ({
      ...current,
      [period]: {
        ...current[period],
        [field]: value,
      },
    }));
  };

  const resetForm = () => {
    setName("");
    setSelectedPeriods(PERIOD_OPTIONS);
    setPeriodTimes(createEmptyPeriodTimes());
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Give this schedule a name.");
      return;
    }
    if (selectedPeriods.length === 0) {
      Alert.alert("Required", "Select at least one period.");
      return;
    }
    const periods = sortPeriods(selectedPeriods).map((period) => ({
      period,
      startTime: periodTimes[period]?.startTime || "",
      endTime: periodTimes[period]?.endTime || "",
    }));
    if (periods.some((period) => !period.startTime || !period.endTime)) {
      Alert.alert(
        "Required",
        "Add both start and end times for every selected period.",
      );
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim(), periods);
      successNotification();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Schedule Type</Text>
          <PressableScale onPress={closeModal}>
            <Text style={styles.modalClose}>Cancel</Text>
          </PressableScale>
        </View>
        <Text style={styles.sectionLabel}>Schedule Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Regular Day, 2-Hour Delay..."
          placeholderTextColor={Colors.muted}
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.sectionLabel}>Select Periods</Text>
        <Text style={styles.subtitle}>
          Check only the periods that meet on this schedule.
        </Text>
        <View style={styles.periodGrid}>
          {PERIOD_OPTIONS.map((period) => {
            const selected = selectedPeriods.includes(period);
            return (
              <PressableScale
                key={period}
                style={[
                  styles.periodToggle,
                  selected && styles.periodToggleActive,
                ]}
                onPress={() => {
                  setSelectedPeriods((current) =>
                    current.includes(period)
                      ? current.filter((value) => value !== period)
                      : sortPeriods([...current, period]),
                  );
                }}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    selected && styles.checkboxBoxActive,
                  ]}
                >
                  {selected ? <View style={styles.checkboxDot} /> : null}
                </View>
                <Text
                  style={[
                    styles.periodToggleText,
                    selected && styles.periodToggleTextActive,
                  ]}
                >
                  {period}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Text style={styles.sectionLabel}>Period Times</Text>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        >
          {sortPeriods(selectedPeriods).map((period) => {
            const values = periodTimes[period] || {
              startTime: "",
              endTime: "",
            };
            return (
              <View key={period} style={styles.periodRow}>
                <Text style={styles.periodLabel}>Period {period}</Text>
                <TextInput
                  style={styles.timeInputSmall}
                  placeholder="08:40"
                  placeholderTextColor={Colors.muted}
                  value={values.startTime}
                  onChangeText={(v) => updatePeriod(period, "startTime", v)}
                />
                <Text style={{ color: Colors.muted }}>–</Text>
                <TextInput
                  style={styles.timeInputSmall}
                  placeholder="09:25"
                  placeholderTextColor={Colors.muted}
                  value={values.endTime}
                  onChangeText={(v) => updatePeriod(period, "endTime", v)}
                />
              </View>
            );
          })}
        </ScrollView>
        <PressableScale
          style={[styles.saveButton, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Schedule</Text>
          )}
        </PressableScale>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Manual Class Entry Modal ───────────────────────────────────────────────

function ManualEntryModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (cls: ScannedClass) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [period, setPeriod] = useState("");
  const [type, setType] = useState<"class" | "club">("class");
  const [saving, setSaving] = useState(false);

  const styles = useThemeStyles();

  const handleSave = async () => {
    if (!name || !period) {
      Alert.alert("Error", "Class name and Period are required.");
      return;
    }
    // sanitize manual entry
    try {
      const clean = sanitizeObjectPayload({ name, teacher, period }, 200);
      const payload: ScannedClass = {
        name: clean.name,
        teacher: clean.teacher,
        period: clean.period,
        type,
        emoji: type === "club" ? "🎉" : "📚",
        startTime: "",
        endTime: "",
      };
      setSaving(true);
      await onSave(payload);
      setSaving(false);
      setName("");
      setTeacher("");
      setPeriod("");
      onClose();
    } catch (e: any) {
      Alert.alert("Invalid input", e.message || "Please check your entries.");
      return;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Class Manually</Text>
          <PressableScale onPress={onClose}>
            <Text style={styles.modalClose}>Cancel</Text>
          </PressableScale>
        </View>

        <ScrollView contentContainerStyle={{ gap: 15 }}>
          <View>
            <Text style={styles.sectionLabel}>Class Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AP Biology"
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View>
            <Text style={styles.sectionLabel}>Teacher</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mr. Smith"
              placeholderTextColor={Colors.muted}
              value={teacher}
              onChangeText={setTeacher}
            />
          </View>

          <View>
            <Text style={styles.sectionLabel}>Period</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1st"
              placeholderTextColor={Colors.muted}
              value={period}
              onChangeText={setPeriod}
            />
          </View>

          <View style={styles.scanRow}>
            <PressableScale
              style={[
                styles.countButton,
                type === "class" && styles.countButtonActive,
              ]}
              onPress={() => setType("class")}
            >
              <Text
                style={[
                  styles.countButtonText,
                  type === "class" && styles.countButtonTextActive,
                ]}
              >
                Academic Class
              </Text>
            </PressableScale>
            <PressableScale
              style={[
                styles.countButton,
                type === "club" && styles.countButtonActive,
              ]}
              onPress={() => setType("club")}
            >
              <Text
                style={[
                  styles.countButtonText,
                  type === "club" && styles.countButtonTextActive,
                ]}
              >
                Club / Activity
              </Text>
            </PressableScale>
          </View>

          <PressableScale
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Add to Schedule</Text>
            )}
          </PressableScale>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Daily Schedule Picker ───────────────────────────────────────────────────

function DailySchedulePicker({
  schoolId,
  userId,
}: {
  schoolId: string;
  userId: string;
}) {
  const { schedules, activeSchedule, votes, voteCounts } =
    useBellSchedules(schoolId);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [newScheduleVisible, setNewScheduleVisible] = useState(false);
  const [voting, setVoting] = useState(false);

  const myVote = votes[userId];
  const totalVotes = Object.keys(votes).length;

  const styles = useThemeStyles();

  const handleVote = async (scheduleId: string) => {
    setVoting(true);
    await voteForSchedule(schoolId, userId, scheduleId);
    setVoting(false);
    setPickerVisible(false);
  };

  const handleCreateSchedule = async (name: string, periods: BellPeriod[]) => {
    const { createBellSchedule: create } =
      await import("../../lib/bellSchedules");
    const id = await create(schoolId, userId, name, periods);
    await voteForSchedule(schoolId, userId, id);
  };

  return (
    <>
      <PressableScale
        style={styles.dayBanner}
        onPress={() => setPickerVisible(true)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.dayBannerLabel}>Today&apos;s Schedule</Text>
          <Text style={styles.dayBannerValue}>
            {activeSchedule ? activeSchedule.name : "Tap to set"}
          </Text>
          {totalVotes > 0 && (
            <Text style={styles.dayBannerVotes}>
              {totalVotes} student{totalVotes !== 1 ? "s" : ""} voted
            </Text>
          )}
        </View>
        <Text style={styles.dayBannerChevron}>›</Text>
      </PressableScale>

      {/* Schedule picker modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Today&apos;s Schedule</Text>
            <PressableScale onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </PressableScale>
          </View>
          <Text style={styles.subtitle}>
            Vote for today&apos;s schedule type.
          </Text>

          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            {schedules.map((s) => {
              const count = voteCounts[s.id] || 0;
              const isMyVote = myVote === s.id;
              const isActive = activeSchedule?.id === s.id;
              return (
                <PressableScale
                  key={s.id}
                  style={[
                    styles.scheduleOption,
                    isActive && styles.scheduleOptionActive,
                    isMyVote && styles.scheduleOptionVoted,
                  ]}
                  onPress={() => handleVote(s.id)}
                  disabled={voting}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.scheduleOptionName,
                        isActive && { color: Colors.primary },
                      ]}
                    >
                      {s.name}
                    </Text>
                    <Text style={styles.scheduleOptionPeriods}>
                      {s.periods.length} period
                      {s.periods.length !== 1 ? "s" : ""} •{" "}
                      {s.periods.map((period) => period.period).join(", ")}
                    </Text>
                  </View>
                  <View style={styles.voteChip}>
                    <Text style={styles.voteChipText}>
                      {count} vote{count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  {isMyVote && <Text style={styles.myVoteDot}>✓</Text>}
                </PressableScale>
              );
            })}

            <PressableScale
              style={styles.addScheduleButton}
              onPress={() => {
                setPickerVisible(false);
                setNewScheduleVisible(true);
              }}
            >
              <Text style={styles.addScheduleText}>
                + Add New Schedule Type
              </Text>
            </PressableScale>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <NewBellScheduleModal
        visible={newScheduleVisible}
        onClose={() => setNewScheduleVisible(false)}
        onSave={handleCreateSchedule}
      />
    </>
  );
}

// ─── Main Schedule Screen ────────────────────────────────────────────────────

export default function Schedule() {
  const styles = useThemeStyles();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { classRooms } = useClassRooms(profile?.schoolId, user?.uid);
  const { activeSchedule, defaultSchedule } = useBellSchedules(
    profile?.schoolId,
  );

  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<"idle" | "schedule" | "times">(
    "idle",
  );
  const [managing, setManaging] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [scannedClasses, setScannedClasses] = useState<ScannedClass[]>([]);
  const [manualVisible, setManualVisible] = useState(false);
  const [scanOptionsVisible, setScanOptionsVisible] = useState(false);
  const [scannedResults, setScannedResults] = useState<ScannedClass[]>([]);
  const [saving, setSaving] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(() => getCurrentMinutes());

  useEffect(() => {
    const updateNow = () => setNowMinutes(getCurrentMinutes());
    updateNow();
    const timer = setInterval(updateNow, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check if today is a weekend
  const isWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }, []);

  // Merge today's bell schedule times into the class list for display
  const sortedClasses = useMemo(() => {
    if (!classRooms || isWeekend) return []; // Return empty on weekends
    const effectiveSchedule = activeSchedule ?? defaultSchedule;
    const activePeriods = effectiveSchedule
      ? sortPeriods(effectiveSchedule.periods.map((period) => period.period))
      : [];
    const activePeriodOrder = new Map(
      activePeriods.map((period, index) => [normalizePeriod(period), index]),
    );
    const activePeriodSet = new Set(activePeriods.map(normalizePeriod));
    const visibleClasses = activeSchedule
      ? classRooms.filter((cls) =>
          activePeriodSet.has(normalizePeriod(cls.period)),
        )
      : classRooms;

    return [...visibleClasses].sort((a, b) => {
      const toMinutes = (t?: string) => {
        if (!t || !t.includes(":")) return 9999;
        const [h, m] = t.split(":").map(Number);
        return h < 7 ? (h + 12) * 60 + m : h * 60 + m;
      };
      // Override times with today's active bell schedule if available
      const getStart = (cls: (typeof classRooms)[0]) => {
        if (activeSchedule) {
          const slot = activeSchedule.periods.find(
            (p) => normalizePeriod(p.period) === normalizePeriod(cls.period),
          );
          if (slot) return toMinutes(slot.startTime);
        }
        return toMinutes(cls.startTime);
      };
      const orderA =
        activePeriodOrder.get(normalizePeriod(a.period)) ??
        Number.MAX_SAFE_INTEGER;
      const orderB =
        activePeriodOrder.get(normalizePeriod(b.period)) ??
        Number.MAX_SAFE_INTEGER;
      if (activeSchedule && orderA !== orderB) return orderA - orderB;
      return getStart(a) - getStart(b);
    });
  }, [classRooms, activeSchedule, defaultSchedule, isWeekend]);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const pickOrTakePhoto = async (
    useCamera: boolean,
  ): Promise<string | null> => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission Denied", "Access needed.");
      return null;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return null;
    try {
      setScanning(true);
      return await uriToBase64(result.assets[0].uri);
    } catch {
      Alert.alert("Error", "Could not process image.");
      return null;
    }
  };

  const startScheduleScan = async (useCamera: boolean) => {
    // 1. Ensure the options modal is closed before launching picker
    setScanOptionsVisible(false);

    const base64 = await pickOrTakePhoto(useCamera);
    if (!base64) {
      setScanning(false);
      setManaging(true); // Return to manage modal if cancelled
      return;
    }

    // 2. We set managing to false so the Scan Step modal can take over the screen
    setManaging(false);
    setScanStep("schedule");

    try {
      const classes = await extractClasses(base64);
      setScannedClasses(classes);
      setScanStep("times");
    } catch {
      Alert.alert("Error", "Could not read schedule.");
      setScanStep("idle");
      setManaging(true);
    } finally {
      setScanning(false);
    }
  };

  const scanTimesPhoto = async (useCamera: boolean) => {
    const base64 = await pickOrTakePhoto(useCamera);
    if (!base64) {
      setScannedResults(
        scannedClasses.map((c) => ({ ...c, startTime: "", endTime: "" })),
      );
      setReviewing(true);
      setScanning(false);
      setScanStep("idle");
      return;
    }
    try {
      const times = await extractTimes(base64);
      setScannedResults(mergeTimes(scannedClasses, times));
      setReviewing(true);
    } catch {
      setScannedResults(
        scannedClasses.map((c) => ({ ...c, startTime: "", endTime: "" })),
      );
      setReviewing(true);
    } finally {
      setScanning(false);
      setScanStep("idle");
    }
  };

  const handleFinalSave = async () => {
    if (!user || !profile?.schoolId) return;
    setSaving(true);
    try {
      const cleaned = scannedResults.map((cls) => {
        const clean = sanitizeObjectPayload(cls, 200);
        return {
          name: clean.name,
          teacher: clean.teacher,
          period: clean.period,
          type: clean.type,
          emoji: clean.emoji || "📖",
          startTime: clean.startTime || "",
          endTime: clean.endTime || "",
        };
      });

      await Promise.all(
        cleaned.map((cls) =>
          joinOrCreateClass(user.uid, profile.schoolId, cls as any),
        ),
      );
      successNotification();
      setReviewing(false);
      setManaging(false);
    } catch {
      Alert.alert("Error", "Failed to save classes.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async (cls: ScannedClass) => {
    if (!user || !profile?.schoolId) return;
    try {
      await joinOrCreateClass(user.uid, profile.schoolId, cls);
      successNotification();
    } catch {
      Alert.alert("Error", "Could not save class.");
    }
  };

  const updateScannedField = (
    index: number,
    field: keyof ScannedClass,
    value: string,
  ) => {
    const updated = [...scannedResults];
    updated[index] = { ...updated[index], [field]: value };
    setScannedResults(updated);
  };

  // Get display times for a class card (override from active bell schedule)
  const getDisplayTimes = (cls: (typeof classRooms)[0]) => {
    if (activeSchedule) {
      const slot = activeSchedule.periods.find(
        (p) => normalizePeriod(p.period) === normalizePeriod(cls.period),
      );
      if (slot) return { startTime: slot.startTime, endTime: slot.endTime };
    }
    return { startTime: cls.startTime, endTime: cls.endTime };
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>My Schedule</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        {/* Daily schedule picker banner */}
        {profile?.schoolId && user?.uid && (
          <DailySchedulePicker schoolId={profile.schoolId} userId={user.uid} />
        )}

        <FlatList
          data={sortedClasses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 12 }}
          renderItem={({ item }) => {
            const { startTime, endTime } = getDisplayTimes(item);
            const progress = getPeriodProgress(startTime, endTime, nowMinutes);
            return (
              <View style={styles.card}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.emojiText}>{item.emoji || "📖"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.className}>{item.name}</Text>
                  <Text style={styles.classDetail}>
                    Period {item.period} • {startTime || "--:--"} –{" "}
                    {endTime || "--:--"}
                  </Text>
                  {item.teacher ? (
                    <Text style={styles.classTeacher}>{item.teacher}</Text>
                  ) : null}
                  {progress ? (
                    <View style={styles.periodProgressWrap}>
                      <View style={styles.periodProgressTrack}>
                        <View
                          style={[
                            styles.periodProgressFill,
                            progress.variant === "active" &&
                              styles.periodProgressFillActive,
                            progress.variant === "past" &&
                              styles.periodProgressFillPast,
                            progress.variant === "upcoming" &&
                              styles.periodProgressFillUpcoming,
                            {
                              width: `${Math.round(progress.progress * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.periodProgressLabel,
                          progress.variant === "active" &&
                            styles.periodProgressLabelActive,
                          progress.variant === "past" &&
                            styles.periodProgressLabelPast,
                        ]}
                      >
                        {progress.label}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            isWeekend ? (
              <Text style={styles.empty}>Enjoy your weekend!</Text>
            ) : (
              <Text style={styles.empty}>
                No classes yet. Tap Manage to add.
              </Text>
            )
          }
        />

        <PressableScale
          style={styles.manageButton}
          onPress={() => setManaging(true)}
        >
          <Text style={styles.manageButtonText}>⚙️ Manage Schedule</Text>
        </PressableScale>

        {/* TIMES SCAN MODAL */}
        <Modal
          visible={scanStep === "times"}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
            <Text style={styles.modalTitle}>Add Times</Text>
            <Text style={styles.subtitle}>
              Scan your bell schedule to add period times.
            </Text>
            {scanning ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : (
              <>
                <View style={styles.scanRow}>
                  <PressableScale
                    style={styles.scanButton}
                    onPress={() => scanTimesPhoto(true)}
                  >
                    <Text style={styles.scanButtonText}>📷 Take Photo</Text>
                  </PressableScale>
                  <PressableScale
                    style={styles.scanButton}
                    onPress={() => scanTimesPhoto(false)}
                  >
                    <Text style={styles.scanButtonText}>🖼️ Upload</Text>
                  </PressableScale>
                </View>
                <PressableScale
                  style={styles.skipButton}
                  onPress={() => {
                    setScannedResults(
                      scannedClasses.map((c) => ({
                        ...c,
                        startTime: "",
                        endTime: "",
                      })),
                    );
                    setReviewing(true);
                    setScanStep("idle");
                  }}
                >
                  <Text style={styles.skipText}>Skip — add times manually</Text>
                </PressableScale>
              </>
            )}
          </SafeAreaView>
        </Modal>

        {/* REVIEW MODAL */}
        <Modal
          visible={reviewing}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
            <Text style={styles.modalTitle}>Review Details</Text>
            <Text style={styles.subtitle}>
              Check your classes and fix anything the AI got wrong.
            </Text>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {scannedResults.map((item, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewBadgeRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        item.type === "club" && styles.typeBadgeClub,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {item.type === "club" ? "Club" : "Class"}
                      </Text>
                    </View>
                    <PressableScale
                      onPress={() =>
                        updateScannedField(
                          index,
                          "type",
                          item.type === "club" ? "class" : "club",
                        )
                      }
                    >
                      <Text style={styles.switchTypeText}>Switch</Text>
                    </PressableScale>
                  </View>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewEmoji}>{item.emoji}</Text>
                    <TextInput
                      style={styles.reviewInputBold}
                      value={item.name}
                      onChangeText={(v) => updateScannedField(index, "name", v)}
                      placeholder="Class name"
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                  <TextInput
                    style={styles.reviewInput}
                    value={item.teacher}
                    onChangeText={(v) =>
                      updateScannedField(index, "teacher", v)
                    }
                    placeholder="Teacher name"
                    placeholderTextColor={Colors.muted}
                  />
                  <TextInput
                    style={styles.reviewInput}
                    value={item.period}
                    onChangeText={(v) => updateScannedField(index, "period", v)}
                    placeholder="Period (e.g. 3rd)"
                    placeholderTextColor={Colors.muted}
                  />
                  <View style={styles.timeRow}>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="Start"
                      placeholderTextColor={Colors.muted}
                      value={item.startTime}
                      onChangeText={(v) =>
                        updateScannedField(index, "startTime", v)
                      }
                    />
                    <Text style={{ color: Colors.muted, alignSelf: "center" }}>
                      –
                    </Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="End"
                      placeholderTextColor={Colors.muted}
                      value={item.endTime}
                      onChangeText={(v) =>
                        updateScannedField(index, "endTime", v)
                      }
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
            <PressableScale
              style={styles.saveButton}
              onPress={handleFinalSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Confirm Schedule</Text>
              )}
            </PressableScale>
            <PressableScale
              onPress={() => setReviewing(false)}
              style={{ marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: Colors.muted }}>Cancel</Text>
            </PressableScale>
          </SafeAreaView>
        </Modal>

        {/* MANAGE MODAL */}
        <Modal
          visible={managing && scanStep === "idle" && !reviewing}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage</Text>
              <PressableScale onPress={() => setManaging(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </PressableScale>
            </View>
            {scanning ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.scanningText}>Reading schedule...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Add to your schedule</Text>
                <View style={styles.scanRow}>
                  <PressableScale
                    style={styles.scanButton}
                    onPress={() => {
                      setManaging(false);
                      setScanOptionsVisible(true);
                    }}
                  >
                    <Text style={styles.scanButtonText}>📷 Scan AI</Text>
                  </PressableScale>
                  <PressableScale
                    style={[styles.scanButton, { borderColor: Colors.primary }]}
                    onPress={() => setManualVisible(true)}
                  >
                    <Text
                      style={[styles.scanButtonText, { color: Colors.primary }]}
                    >
                      ✍️ Manual
                    </Text>
                  </PressableScale>
                </View>
              </>
            )}
            <FlatList
              data={classRooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.manageCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.manageName}>
                      {item.emoji} {item.name}
                    </Text>
                    <Text style={styles.manageSub}>
                      Period {item.period} • {item.startTime || "--:--"} –{" "}
                      {item.endTime || "--:--"}
                    </Text>
                    {item.teacher ? (
                      <Text style={styles.manageSub}>{item.teacher}</Text>
                    ) : null}
                  </View>
                  <PressableScale
                    onPress={() =>
                      leaveClass(user!.uid, profile!.schoolId, item.id)
                    }
                  >
                    <Text style={{ color: "#FF4444", fontWeight: "600" }}>
                      Remove
                    </Text>
                  </PressableScale>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>

        <ManualEntryModal
          visible={manualVisible}
          onClose={() => setManualVisible(false)}
          onSave={handleManualSave}
        />

        {/* SCAN OPTIONS MODAL */}
        <Modal
          visible={scanOptionsVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modal} edges={["top", "bottom"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Schedule</Text>
              <PressableScale
                onPress={() => {
                  setScanOptionsVisible(false);
                  setManaging(true);
                }}
              >
                <Text style={styles.modalClose}>Cancel</Text>
              </PressableScale>
            </View>
            <Text style={styles.subtitle}>
              Choose an option to import your classes using AI.
            </Text>
            <View style={styles.scanRow}>
              <PressableScale
                style={styles.scanButton}
                onPress={() => {
                  setScanOptionsVisible(false);
                  startScheduleScan(true);
                }}
              >
                <Text style={styles.scanButtonText}>📷 Take Photo</Text>
              </PressableScale>
              <PressableScale
                style={styles.scanButton}
                onPress={() => {
                  setScanOptionsVisible(false);
                  startScheduleScan(false);
                }}
              >
                <Text style={styles.scanButtonText}>🖼️ Photo Library</Text>
              </PressableScale>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const useThemeStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme === "light" ? "#FFFFFF" : Colors.background,
        },
        container: {
          flex: 1,
          backgroundColor: theme === "light" ? "#FFFFFF" : Colors.background,
          padding: 20,
          paddingTop: 0,
        },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        },
        header: {
          fontSize: 28,
          fontWeight: "900",
          color: theme === "light" ? "#0B1020" : Colors.text,
        },
        dateText: { fontSize: 18, color: Colors.primary, fontWeight: "700" },

        // Daily schedule banner
        dayBanner: {
          backgroundColor: Colors.card,
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: Colors.border,
          marginBottom: 4,
        },
        dayBannerLabel: {
          color: Colors.muted,
          fontSize: 11,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        dayBannerValue: {
          color: Colors.text,
          fontSize: 16,
          fontWeight: "700",
          marginTop: 2,
        },
        dayBannerVotes: { color: Colors.muted, fontSize: 11, marginTop: 2 },
        dayBannerChevron: { color: Colors.muted, fontSize: 24 },

        card: {
          backgroundColor: Colors.card,
          padding: 16,
          borderRadius: 18,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: Colors.border,
          gap: 14,
        },
        emojiContainer: {
          width: 48,
          height: 48,
          backgroundColor: Colors.background,
          borderRadius: 14,
          justifyContent: "center",
          alignItems: "center",
        },
        emojiText: { fontSize: 24 },
        className: {
          color: Colors.text,
          fontWeight: "700",
          fontSize: 17,
          marginBottom: 2,
        },
        classDetail: { color: Colors.muted, fontSize: 13, fontWeight: "500" },
        classTeacher: { color: Colors.muted, fontSize: 12, marginTop: 2 },
        periodProgressWrap: {
          marginTop: 10,
          gap: 6,
        },
        periodProgressTrack: {
          width: "100%",
          height: 8,
          borderRadius: 999,
          backgroundColor: Colors.background,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: Colors.border,
        },
        periodProgressFill: {
          height: "100%",
          borderRadius: 999,
        },
        periodProgressFillUpcoming: {
          backgroundColor: Colors.background,
        },
        periodProgressFillActive: {
          backgroundColor: Colors.primary,
        },
        periodProgressFillPast: {
          backgroundColor: Colors.primary,
        },
        periodProgressLabel: {
          color: Colors.muted,
          fontSize: 12,
          fontWeight: "600",
        },
        periodProgressLabelActive: {
          color: Colors.primary,
        },
        periodProgressLabelPast: {
          color: Colors.primary,
        },

        manageButton: {
          backgroundColor: Colors.card,
          padding: 16,
          borderRadius: 16,
          alignItems: "center",
          borderWidth: 1,
          borderColor: Colors.border,
          borderStyle: "dashed",
        },
        manageButtonText: { color: Colors.primary, fontWeight: "700" },
        center: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        },
        scanningText: { color: Colors.muted, fontSize: 15 },

        modal: {
          flex: 1,
          backgroundColor: Colors.background,
          padding: 24,
          paddingTop: 20,
        },
        modalTitle: {
          color: Colors.text,
          fontSize: 26,
          fontWeight: "900",
          marginBottom: 4,
        },
        subtitle: {
          color: Colors.muted,
          fontSize: 15,
          marginBottom: 24,
          lineHeight: 22,
        },
        modalHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        },
        modalClose: { color: Colors.primary, fontWeight: "700", fontSize: 16 },
        sectionLabel: {
          color: Colors.muted,
          fontSize: 13,
          fontWeight: "600",
          textTransform: "uppercase",
          marginBottom: 12,
          marginTop: 8,
        },

        // Schedule picker
        scheduleOption: {
          backgroundColor: Colors.card,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: Colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        scheduleOptionActive: { borderColor: Colors.primary },
        scheduleOptionVoted: { borderColor: Colors.primary + "88" },
        scheduleOptionName: {
          color: Colors.text,
          fontWeight: "700",
          fontSize: 15,
        },
        scheduleOptionPeriods: {
          color: Colors.muted,
          fontSize: 12,
          marginTop: 2,
        },
        voteChip: {
          backgroundColor: Colors.background,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 10,
        },
        voteChipText: { color: Colors.muted, fontSize: 12, fontWeight: "600" },
        myVoteDot: { color: Colors.primary, fontWeight: "900", fontSize: 16 },
        addScheduleButton: {
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: Colors.border,
          borderStyle: "dashed",
          alignItems: "center",
        },
        addScheduleText: { color: Colors.primary, fontWeight: "600" },

        // New bell schedule form
        input: {
          backgroundColor: Colors.card,
          color: Colors.text,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          fontSize: 15,
          marginBottom: 12,
        },
        periodCountRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
        countButton: {
          flex: 1,
          padding: 12,
          borderRadius: 10,
          backgroundColor: Colors.card,
          alignItems: "center",
          borderWidth: 1,
          borderColor: Colors.border,
        },
        countButtonActive: {
          backgroundColor: Colors.primary,
          borderColor: Colors.primary,
        },
        countButtonText: { color: Colors.muted, fontWeight: "600" },
        countButtonTextActive: { color: "#fff" },
        periodGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
        },
        periodToggle: {
          width: "31%",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 12,
          borderRadius: 12,
          backgroundColor: Colors.card,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        periodToggleActive: {
          backgroundColor: Colors.primary + "18",
          borderColor: Colors.primary,
        },
        periodToggleText: { color: Colors.text, fontWeight: "700" },
        periodToggleTextActive: { color: Colors.primary },
        checkboxBox: {
          width: 18,
          height: 18,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: Colors.border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.background,
        },
        checkboxBoxActive: {
          borderColor: Colors.primary,
          backgroundColor: Colors.primary,
        },
        checkboxDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "#fff",
        },
        periodRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: Colors.card,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        periodLabel: {
          color: Colors.text,
          fontWeight: "600",
          width: 64,
          fontSize: 14,
        },
        timeInputSmall: {
          flex: 1,
          backgroundColor: Colors.background,
          color: Colors.text,
          padding: 10,
          borderRadius: 8,
          fontSize: 14,
          textAlign: "center",
          borderWidth: 1,
          borderColor: Colors.border,
        },

        // Review modal
        reviewCard: {
          backgroundColor: Colors.card,
          padding: 16,
          borderRadius: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          gap: 10,
        },
        reviewBadgeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        },
        typeBadge: {
          backgroundColor: Colors.primary + "22",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        },
        typeBadgeClub: { backgroundColor: Colors.secondary + "22" },
        typeBadgeText: {
          color: Colors.primary,
          fontWeight: "700",
          fontSize: 12,
        },
        switchTypeText: {
          color: Colors.muted,
          fontSize: 12,
          textDecorationLine: "underline",
        },
        reviewTop: { flexDirection: "row", alignItems: "center", gap: 12 },
        reviewEmoji: { fontSize: 26 },
        reviewInputBold: {
          flex: 1,
          color: Colors.text,
          fontSize: 17,
          fontWeight: "700",
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          paddingBottom: 4,
        },
        reviewInput: {
          color: Colors.text,
          fontSize: 14,
          backgroundColor: Colors.background,
          padding: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        timeRow: { flexDirection: "row", gap: 10, alignItems: "center" },
        timeInput: {
          flex: 1,
          backgroundColor: Colors.background,
          color: Colors.text,
          padding: 12,
          borderRadius: 10,
          fontSize: 14,
          textAlign: "center",
          borderWidth: 1,
          borderColor: Colors.border,
        },

        saveButton: {
          backgroundColor: Colors.primary,
          padding: 18,
          borderRadius: 18,
          alignItems: "center",
          marginTop: 10,
        },
        saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
        skipButton: { padding: 16, alignItems: "center" },
        skipText: { color: Colors.muted, fontSize: 15 },
        scanRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
        scanButton: {
          flex: 1,
          backgroundColor: Colors.card,
          padding: 16,
          borderRadius: 14,
          alignItems: "center",
          borderWidth: 1,
          borderColor: Colors.border,
        },
        scanButtonText: { color: Colors.text, fontWeight: "600" },
        manageCard: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          backgroundColor: Colors.card,
          borderRadius: 14,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        manageName: { color: Colors.text, fontWeight: "600" },
        manageSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
        empty: {
          color: Colors.muted,
          textAlign: "center",
          marginTop: 40,
          fontSize: 15,
        },
      }),
    [theme],
  );
};
