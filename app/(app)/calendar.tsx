import { PressableScale } from "@/components/animated-helpers";
import { Colors } from "@/constants/colors";
import { classstyles } from "@/constants/styles";
import { useAuth } from "@/hooks/useAuth";
import { useBellSchedules } from "@/hooks/useBellSchedules";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useClassRooms } from "@/hooks/useClassRooms";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { createPersonalEvent } from "@/lib/calendarEvents";
import { successNotification } from "@/lib/haptics";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateKey = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const normalizePeriod = (period: string) =>
  period
    .toLowerCase()
    .replace(/period/g, "")
    .replace(/(st|nd|rd|th)/g, "")
    .trim()
    .replace(/^0+/, "");

const getTimeSortValue = (time?: string) => {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const normalized = time.trim().toLowerCase();
  const match = normalized.match(/^(\d{1,2})(?:\:(\d{2}))?\s*(am|pm)?$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2] || "0", 10);
  const meridiem = match[3];

  if (meridiem === "am" && hour === 12) hour = 0;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (!meridiem && hour < 7) hour += 12;

  return hour * 60 + minute;
};

export default function CalendarScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { classRooms } = useClassRooms(profile?.schoolId, user?.uid);
  const { activeSchedule, defaultSchedule } = useBellSchedules(
    profile?.schoolId,
  );
  const { eventsByDate } = useCalendarEvents(user?.uid);

  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date()),
  );
  const [addingEvent, setAddingEvent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [details, setDetails] = useState("");

  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [monthDate]);

  const gridCells = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const count = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    return Array.from({ length: count }, (_, i) => {
      const day = i - firstDay + 1;
      if (day < 1 || day > daysInMonth) return null;
      const date = new Date(year, month, day);
      return { day, dateKey: toDateKey(date), weekDay: date.getDay() };
    });
  }, [daysInMonth, monthDate]);

  const selectedDate = useMemo(
    () => parseDateKey(selectedDateKey),
    [selectedDateKey],
  );
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;

  const selectedDayEvents = eventsByDate[selectedDateKey] || [];

  const schoolBlocks = useMemo(() => {
    if (isWeekend) return [];

    // Use today's active schedule if there's an override for the selected day,
    // otherwise fall back to the school's default bell schedule template.
    const effectiveSchedule = activeSchedule ?? defaultSchedule;
    const activePeriods = (effectiveSchedule as any)?.periods || [];
    const periodMap = new Map(
      activePeriods.map((period: any) => [
        normalizePeriod(period.period),
        period,
      ]),
    );
    const activeSet = new Set(
      activePeriods.map((period: any) => normalizePeriod(period.period)),
    );

    const visible = activePeriods.length
      ? classRooms.filter((cls) => activeSet.has(normalizePeriod(cls.period)))
      : classRooms;

    return [...visible]
      .map((cls) => {
        const periodData = periodMap.get(normalizePeriod(cls.period)) as any;
        const start = periodData?.startTime || cls.startTime;
        const end = periodData?.endTime || cls.endTime;
        return {
          id: cls.id,
          name: cls.name,
          teacher: cls.teacher,
          period: cls.period,
          start,
          end,
        };
      })
      .sort((a, b) => getTimeSortValue(a.start) - getTimeSortValue(b.start));
  }, [activeSchedule, defaultSchedule, classRooms, isWeekend]);

  const goToMonth = (offset: number) => {
    const next = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + offset,
      1,
    );
    setMonthDate(next);
  };

  const resetEventForm = () => {
    setName("");
    setStartTime("");
    setEndTime("");
    setDetails("");
  };

  const saveEvent = async () => {
    if (!user?.uid) return;
    if (!name.trim() || !startTime.trim() || !endTime.trim()) {
      Alert.alert("Required", "Add name, start time, and end time.");
      return;
    }

    setSaving(true);
    try {
      await createPersonalEvent(user.uid, {
        name,
        dateKey: selectedDateKey,
        startTime,
        endTime,
        details,
      });
      successNotification();
      resetEventForm();
      setAddingEvent(false);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not save event.");
    } finally {
      setSaving(false);
    }
  };

  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme === "light" ? "#FFFFFF" : Colors.background,
        },
        content: { padding: 16, paddingBottom: 30, gap: 12 },
        header: {
          color: theme === "light" ? "#0B1020" : Colors.text,
          fontSize: 28,
          fontWeight: "700",
          marginTop: 16,
        },
        monthHeader: {
          marginTop: 4,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        monthButton: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: theme === "light" ? "#FFFFFF" : Colors.card,
          alignItems: "center",
          justifyContent: "center",
        },
        monthButtonText: {
          color: theme === "light" ? "#0B1020" : Colors.text,
          fontSize: 22,
          lineHeight: 22,
        },
        monthLabel: {
          color: theme === "light" ? "#0B1020" : Colors.text,
          fontSize: 18,
          fontWeight: "700",
        },
        weekRow: { flexDirection: "row", marginTop: 10 },
        weekLabel: {
          flex: 1,
          color: theme === "light" ? "rgba(11,16,32,0.45)" : Colors.muted,
          textAlign: "center",
          fontSize: 12,
          fontWeight: "600",
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          backgroundColor: theme === "light" ? "#FFFFFF" : Colors.card,
          borderRadius: 14,
          padding: 6,
          justifyContent: "flex-start",
        },
        dayCell: {
          flexBasis: "14.2857%",
          maxWidth: "14.2857%",
          aspectRatio: 1,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.03)",
          marginBottom: 6,
          padding: 6,
        },
        dayCellEmpty: {
          flexBasis: "14.2857%",
          maxWidth: "14.2857%",
          aspectRatio: 1,
          marginBottom: 6,
        },
        dayCellWeekend: {
          borderWidth: 1,
          borderColor: "rgba(249,115,22,0.25)",
        },
        dayCellSelected: { backgroundColor: Colors.primary },
        dayText: { color: Colors.text, fontWeight: "600" },
        dayTextSelected: { color: "#fff" },
        eventDot: {
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: Colors.secondary,
        },
        sectionCard: {
          backgroundColor: Colors.card,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        sectionTitleRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        },
        sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: "700" },
        addButton: {
          backgroundColor: Colors.primary,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        addButtonText: { color: "#fff", fontWeight: "700" },
        sectionSubtitle: {
          color: Colors.secondary,
          fontSize: 13,
          fontWeight: "700",
        },
        weekendText: { color: Colors.muted, marginTop: 8, marginBottom: 2 },
        emptyText: { color: Colors.muted, marginTop: 8, marginBottom: 2 },
        blockCard: {
          marginTop: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.background,
          padding: 10,
          gap: 2,
        },
        blockTitle: { color: Colors.text, fontWeight: "700", fontSize: 14 },
        blockMeta: { color: Colors.muted, fontSize: 12 },
        eventCard: {
          marginTop: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: "rgba(249,115,22,0.08)",
          padding: 10,
          gap: 3,
        },
        eventTitle: { color: Colors.text, fontWeight: "700", fontSize: 14 },
        eventDetails: { color: Colors.text, fontSize: 13, lineHeight: 18 },
        modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        },
        modalCard: {
          backgroundColor: Colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
          gap: 10,
        },
        modalTitle: { color: Colors.text, fontSize: 20, fontWeight: "700" },
        modalHint: { color: Colors.muted, marginBottom: 4 },
        input: {
          backgroundColor: Colors.background,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: Colors.border,
          color: Colors.text,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        timeRow: { flexDirection: "row", gap: 8 },
        timeInput: { flex: 1 },
        detailsInput: { minHeight: 74, textAlignVertical: "top" },
        modalActions: { flexDirection: "row", gap: 8, marginTop: 4 },
        modalButton: {
          flex: 1,
          borderRadius: 10,
          paddingVertical: 12,
          alignItems: "center",
        },
        cancelButton: { backgroundColor: Colors.background },
        saveButton: { backgroundColor: Colors.primary },
        modalButtonText: { color: Colors.text, fontWeight: "700" },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={classstyles.headerText}>Calendar</Text>

        <View style={styles.monthHeader}>
          <PressableScale
            style={styles.monthButton}
            onPress={() => goToMonth(-1)}
          >
            <Text style={styles.monthButtonText}>‹</Text>
          </PressableScale>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <PressableScale
            style={styles.monthButton}
            onPress={() => goToMonth(1)}
          >
            <Text style={styles.monthButtonText}>›</Text>
          </PressableScale>
        </View>

        <View style={styles.weekRow}>
          {WEEK_LABELS.map((label) => (
            <Text key={label} style={styles.weekLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {gridCells.map((cell, index) => {
            if (!cell) {
              return (
                <View key={`empty-${index}`} style={styles.dayCellEmpty} />
              );
            }
            const selected = cell.dateKey === selectedDateKey;
            const hasEvent = (eventsByDate[cell.dateKey] || []).length > 0;
            const weekend = cell.weekDay === 0 || cell.weekDay === 6;

            return (
              <PressableScale
                key={cell.dateKey}
                style={[
                  styles.dayCell,
                  weekend && styles.dayCellWeekend,
                  selected && styles.dayCellSelected,
                ]}
                onPress={() => setSelectedDateKey(cell.dateKey)}
              >
                <Text
                  style={[styles.dayText, selected && styles.dayTextSelected]}
                >
                  {cell.day}
                </Text>
                {hasEvent ? <View style={styles.eventDot} /> : null}
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
            <PressableScale
              style={styles.addButton}
              onPress={() => setAddingEvent(true)}
            >
              <Text style={styles.addButtonText}>+ Event</Text>
            </PressableScale>
          </View>

          <Text style={styles.sectionSubtitle}>School Schedule</Text>
          {isWeekend ? (
            <Text style={styles.weekendText}>
              Saturday and Sunday are not school days.
            </Text>
          ) : schoolBlocks.length === 0 ? (
            <Text style={styles.emptyText}>No class blocks for this day.</Text>
          ) : (
            schoolBlocks.map((block) => (
              <View key={block.id} style={styles.blockCard}>
                <Text style={styles.blockTitle}>{block.name}</Text>
                <Text style={styles.blockMeta}>
                  Period {block.period} • {block.start || "--:--"} -{" "}
                  {block.end || "--:--"}
                </Text>
                <Text style={styles.blockMeta}>{block.teacher}</Text>
              </View>
            ))
          )}

          <Text style={[styles.sectionSubtitle, { marginTop: 14 }]}>
            Events
          </Text>
          {selectedDayEvents.length === 0 ? (
            <Text style={styles.emptyText}>No events yet.</Text>
          ) : (
            selectedDayEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.name}</Text>
                <Text style={styles.blockMeta}>
                  {event.startTime} - {event.endTime}
                </Text>
                {event.details ? (
                  <Text style={styles.eventDetails}>{event.details}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={addingEvent} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Event</Text>
            <Text style={styles.modalHint}>Date: {selectedDateKey}</Text>

            <TextInput
              style={classstyles.input}
              placeholder="Event name"
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.timeRow}>
              <TextInput
                style={[classstyles.input, styles.timeInput]}
                placeholder="Start (3:30 PM)"
                placeholderTextColor={Colors.muted}
                value={startTime}
                onChangeText={setStartTime}
              />
              <TextInput
                style={[classstyles.input, styles.timeInput]}
                placeholder="End (5:00 PM)"
                placeholderTextColor={Colors.muted}
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
            <TextInput
              style={[classstyles.input, styles.detailsInput]}
              placeholder="Details"
              placeholderTextColor={Colors.muted}
              value={details}
              onChangeText={setDetails}
              multiline
            />

            <View style={styles.modalActions}>
              <PressableScale
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAddingEvent(false);
                  resetEventForm();
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </PressableScale>
              <PressableScale
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  saving && { opacity: 0.5 },
                ]}
                onPress={saveEvent}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </PressableScale>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
