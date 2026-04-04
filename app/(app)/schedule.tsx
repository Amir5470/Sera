import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
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
import { PressableScale } from "../../components/animated-helpers";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { useBellSchedules } from "../../hooks/useBellSchedules";
import { useClassRooms } from "../../hooks/useClassRooms";
import { useProfile } from "../../hooks/useProfile";
import { BellPeriod, voteForSchedule } from "../../lib/bellSchedules";
import { joinOrCreateClass, leaveClass } from "../../lib/classes";
import { successNotification } from "../../lib/haptics";

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY!;

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
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const callClaude = async (base64: string, prompt: string) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
  });
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
  const [periodCount, setPeriodCount] = useState(8);
  const [periods, setPeriods] = useState<BellPeriod[]>(
    Array.from({ length: 8 }, (_, i) => ({
      period: String(i + 1),
      startTime: "",
      endTime: "",
    })),
  );
  const [saving, setSaving] = useState(false);

  const updatePeriod = (
    index: number,
    field: keyof BellPeriod,
    value: string,
  ) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };
    setPeriods(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Give this schedule a name.");
      return;
    }
    const filled = periods
      .slice(0, periodCount)
      .filter((p) => p.startTime && p.endTime);
    if (filled.length === 0) {
      Alert.alert("Required", "Add times for at least one period.");
      return;
    }
    setSaving(true);
    await onSave(name.trim(), periods.slice(0, periodCount));
    successNotification();
    setSaving(false);
    onClose();
    setName("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Schedule Type</Text>
          <PressableScale onPress={onClose}>
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
        <Text style={styles.sectionLabel}>Number of Periods</Text>
        <View style={styles.periodCountRow}>
          {[6, 7, 8, 9].map((n) => (
            <PressableScale
              key={n}
              style={[
                styles.countButton,
                periodCount === n && styles.countButtonActive,
              ]}
              onPress={() => {
                setPeriodCount(n);
                setPeriods(
                  Array.from({ length: n }, (_, i) => ({
                    period: String(i + 1),
                    startTime: periods[i]?.startTime || "",
                    endTime: periods[i]?.endTime || "",
                  })),
                );
              }}
            >
              <Text
                style={[
                  styles.countButtonText,
                  periodCount === n && styles.countButtonTextActive,
                ]}
              >
                {n}
              </Text>
            </PressableScale>
          ))}
        </View>
        <Text style={styles.sectionLabel}>Period Times</Text>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        >
          {periods.slice(0, periodCount).map((p, i) => (
            <View key={i} style={styles.periodRow}>
              <Text style={styles.periodLabel}>Period {p.period}</Text>
              <TextInput
                style={styles.timeInputSmall}
                placeholder="08:40"
                placeholderTextColor={Colors.muted}
                value={p.startTime}
                onChangeText={(v) => updatePeriod(i, "startTime", v)}
              />
              <Text style={{ color: Colors.muted }}>–</Text>
              <TextInput
                style={styles.timeInputSmall}
                placeholder="09:25"
                placeholderTextColor={Colors.muted}
                value={p.endTime}
                onChangeText={(v) => updatePeriod(i, "endTime", v)}
              />
            </View>
          ))}
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
      </View>
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
        <View style={styles.modal}>
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
                      {s.periods.length} periods • {s.periods[0]?.startTime} –{" "}
                      {s.periods[s.periods.length - 1]?.endTime}
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
        </View>
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
  const { user } = useAuth();
  const { profile } = useProfile();
  const { classRooms } = useClassRooms(profile?.schoolId, user?.uid);
  const { activeSchedule } = useBellSchedules(profile?.schoolId);

  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<"idle" | "schedule" | "times">(
    "idle",
  );
  const [managing, setManaging] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [scannedClasses, setScannedClasses] = useState<ScannedClass[]>([]);
  const [scannedResults, setScannedResults] = useState<ScannedClass[]>([]);
  const [saving, setSaving] = useState(false);

  // Merge today's bell schedule times into the class list for display
  const sortedClasses = useMemo(() => {
    if (!classRooms) return [];
    return [...classRooms].sort((a, b) => {
      const toMinutes = (t?: string) => {
        if (!t || !t.includes(":")) return 9999;
        const [h, m] = t.split(":").map(Number);
        return h < 7 ? (h + 12) * 60 + m : h * 60 + m;
      };
      // Override times with today's active bell schedule if available
      const getStart = (cls: (typeof classRooms)[0]) => {
        if (activeSchedule) {
          const normalize = (p: string) =>
            p.replace(/(st|nd|rd|th)/gi, "").trim();
          const slot = activeSchedule.periods.find(
            (p) => normalize(p.period) === normalize(cls.period),
          );
          if (slot) return toMinutes(slot.startTime);
        }
        return toMinutes(cls.startTime);
      };
      return getStart(a) - getStart(b);
    });
  }, [classRooms, activeSchedule]);

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
    const base64 = await pickOrTakePhoto(useCamera);
    if (!base64) {
      setScanning(false);
      return;
    }
    setManaging(false);
    setScanStep("schedule");
    try {
      const classes = await extractClasses(base64);
      setScannedClasses(classes);
      setScanStep("times");
    } catch {
      Alert.alert("Error", "Could not read schedule.");
      setScanStep("idle");
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
      await Promise.all(
        scannedResults.map((cls) =>
          joinOrCreateClass(user.uid, profile.schoolId, cls),
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
      const normalize = (p: string) => p.replace(/(st|nd|rd|th)/gi, "").trim();
      const slot = activeSchedule.periods.find(
        (p) => normalize(p.period) === normalize(cls.period),
      );
      if (slot) return { startTime: slot.startTime, endTime: slot.endTime };
    }
    return { startTime: cls.startTime, endTime: cls.endTime };
  };

  return (
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
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No classes yet. Tap Manage to add.</Text>
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
        <View style={styles.modal}>
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
        </View>
      </Modal>

      {/* REVIEW MODAL */}
      <Modal
        visible={reviewing}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
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
                  onChangeText={(v) => updateScannedField(index, "teacher", v)}
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
        </View>
      </Modal>

      {/* MANAGE MODAL */}
      <Modal
        visible={managing && scanStep === "idle" && !reviewing}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
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
              <Text style={styles.sectionLabel}>Scan your schedule</Text>
              <View style={styles.scanRow}>
                <PressableScale
                  style={styles.scanButton}
                  onPress={() => startScheduleScan(true)}
                >
                  <Text style={styles.scanButtonText}>📷 Take Photo</Text>
                </PressableScale>
                <PressableScale
                  style={styles.scanButton}
                  onPress={() => startScheduleScan(false)}
                >
                  <Text style={styles.scanButtonText}>🖼️ Upload</Text>
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  header: { fontSize: 28, fontWeight: "900", color: Colors.text },
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
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
  scheduleOptionName: { color: Colors.text, fontWeight: "700", fontSize: 15 },
  scheduleOptionPeriods: { color: Colors.muted, fontSize: 12, marginTop: 2 },
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
  typeBadgeText: { color: Colors.primary, fontWeight: "700", fontSize: 12 },
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
});
