import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors } from "../../constants/colors";
import usePomodoro from "../../hooks/usePomodoro";

type Preset = { work: number; rest: number; label?: string };

const DEFAULT_PRESETS: Preset[] = [
  { work: 25, rest: 5, label: "25/5" },
  { work: 50, rest: 10, label: "50/10" },
];

export default function PomodoroTimer({
  presets = DEFAULT_PRESETS,
}: {
  presets?: Preset[];
}) {
  const { secondsLeft, isRunning, mode, start, pause, reset, percent } =
    usePomodoro();

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const [workInput, setWorkInput] = useState(String(DEFAULT_PRESETS[0].work));
  const [breakInput, setBreakInput] = useState(String(DEFAULT_PRESETS[0].rest));
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempWork, setTempWork] = useState(workInput);
  const [tempBreak, setTempBreak] = useState(breakInput);

  const windowWidth = Dimensions.get("window").width;
  const size = Math.min(360, windowWidth - 40);
  const stroke = 12;
  const radius = size / 2 - stroke / 2;
  const circumference = Math.PI * 2 * radius;

  return (
    <View style={[styles.container, { width: "100%", marginHorizontal: -10 }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: Colors.card,
            width: Dimensions.get("window").width,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={[styles.circleWrapFull, { width: size, height: size }]}>
            <Svg height={size} width={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#eee"
                strokeWidth={stroke}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={Colors.primary}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - percent)}`}
                strokeLinecap="round"
                rotation={-90}
                originX={size / 2}
                originY={size / 2}
              />
            </Svg>
            <View
              style={[
                styles.timeOverlayFull,
                { width: size, height: size, justifyContent: "center" },
              ]}
              pointerEvents="none"
            >
              <Text style={[styles.timeText, { color: Colors.text }]}>
                {`${minutes}:${secs.toString().padStart(2, "0")}`}
              </Text>
              <Text style={styles.modeText}>
                {mode === "work" ? "Focus" : "Break"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.presetsRowWrap}>
          {presets.map((p) => (
            <TouchableOpacity
              key={`${p.work}-${p.rest}`}
              style={styles.presetFull}
              onPress={() => {
                setWorkInput(String(p.work));
                setBreakInput(String(p.rest));
                start(p.work * 60, p.rest * 60);
              }}
            >
              <Text style={styles.presetText}>
                {p.label ?? `${p.work}/${p.rest}`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            key="custom"
            style={[styles.presetFull, { backgroundColor: Colors.primary }]}
            onPress={() => {
              setTempWork(workInput);
              setTempBreak(breakInput);
              setShowCustomModal(true);
            }}
          >
            <Text style={[styles.presetText, { color: "#fff" }]}>Custom</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsRowFull}>
          <TouchableOpacity
            style={[styles.button, { flex: 1 }]}
            onPress={() => (isRunning ? pause() : start())}
          >
            <Text style={styles.buttonText}>
              {isRunning ? "Pause" : "Resume"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.reset, { marginLeft: 10 }]}
            onPress={reset}
          >
            <Text style={[styles.buttonText, styles.resetText]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={showCustomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Preset</Text>
            <Text style={styles.inputLabel}>Work (minutes)</Text>
            <TextInput
              keyboardType="number-pad"
              value={tempWork}
              onChangeText={(v) => setTempWork(v.replace(/[^0-9]/g, ""))}
              style={styles.input}
              placeholder="25"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>
              Break (minutes)
            </Text>
            <TextInput
              keyboardType="number-pad"
              value={tempBreak}
              onChangeText={(v) => setTempBreak(v.replace(/[^0-9]/g, ""))}
              style={styles.input}
              placeholder="5"
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { flex: 1 }]}
                onPress={() => {
                  const w = Math.max(1, parseInt(tempWork || "0", 10) || 1);
                  const b = Math.max(1, parseInt(tempBreak || "0", 10) || 1);
                  setWorkInput(String(w));
                  setBreakInput(String(b));
                  setShowCustomModal(false);
                  start(w * 60, b * 60);
                }}
              >
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.reset,
                  { marginLeft: 10, flex: 1 },
                ]}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={[styles.buttonText, styles.resetText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "stretch", paddingHorizontal: 0 },
  card: { borderRadius: 14, padding: 10 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  circleWrapFull: {
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  timeOverlayFull: { position: "absolute", alignItems: "center" },
  timeText: { fontSize: 32, fontWeight: "700" },
  modeText: { fontSize: 13, color: Colors.muted, marginTop: 6 },
  inputsCol: { flex: 1 },
  inputLabel: { fontSize: 12, color: Colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: Colors.background2,
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  valueText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 6,
  },
  controls: { marginTop: 18 },
  presetsRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  presetFull: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background2,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  presetText: { color: Colors.text },
  buttonsRowFull: { flexDirection: "row", marginTop: 12 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700" },
  reset: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetText: { color: Colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: Colors.card, borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  modalButtons: { flexDirection: "row", marginTop: 16 },
});
