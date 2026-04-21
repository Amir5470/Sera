import { PressableScale } from "@/components/animated-helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Colors } from "../../constants/colors";
import { classstyles } from "../../constants/styles";

export default function Step2() {
  const router = useRouter();
  const [dob, setDob] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Check if this device is already flagged as "underage" on mount
  useEffect(() => {
    const checkLockStatus = async () => {
      const blocked = await AsyncStorage.getItem("user_blocked");
      if (blocked === "true") {
        setIsLocked(true);
      }
    };
    checkLockStatus();
  }, []);

  // Formats digits into MM/DD/YYYY automatically
  const handleTextChange = (text: string) => {
    if (isLocked) return;
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setDob(formatted);
  };

  const calculateAge = (birthDate: string) => {
    const [month, day, year] = birthDate.split("/").map(Number);
    const today = new Date();
    const birth = new Date(year, month - 1, day);

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Age lock handling

  const handleNext = async () => {
    if (dob.length < 10) {
      Alert.alert("Wait!", "Please enter your full birthday.");
      return;
    }

    const age = calculateAge(dob);

    if (age < 13) {
      // PERMANENT LOCK: Save to device storage
      await AsyncStorage.setItem("user_blocked", "true");
      setIsLocked(true);
      return;
    }

    if (age > 100 || age < 0) {
      Alert.alert("Invalid Date", "Please check your birth year.");
      return;
    }

    router.push("/(onboarding)/step3" as any);
  };
  // Rendering Step 2 - Age Gate
  // --- RENDER: BLOCKED VIEW ---
  if (isLocked) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.title, { textAlign: "center", color: "#FF4444" }]}>
          Access Denied
        </Text>
        <Text style={[styles.subtitle, { textAlign: "center" }]}>
          Sera is not available for your age group at this time due to safety
          regulations.
        </Text>
        <View style={{ height: 40 }} />
        <PressableScale
          style={[styles.button, { width: "100%" }]}
          onPress={() => router.replace("/(auth)/sign-in" as any)}
        >
          <Text style={styles.buttonText}>Exit</Text>
        </PressableScale>
      </View>
    );
  }

  // --- RENDER: ONBOARDING VIEW ---
  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <Text style={classstyles.headerText}>When&apos;s your birthday?</Text>
      <Text style={styles.subtitle}>
        We need this to verify your age for legal and safety reasons.
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="MM/DD/YYYY"
          placeholderTextColor={Colors.muted}
          keyboardType="number-pad"
          maxLength={10}
          value={dob}
          onChangeText={handleTextChange}
          autoFocus
        />
      </View>

      <View style={{ flex: 1 }} />

      <PressableScale
        style={[styles.button, dob.length < 10 && styles.buttonDisabled]}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Next →</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 80,
  },
  centered: { justifyContent: "center", alignItems: "center" },
  progress: { flexDirection: "row", gap: 8, marginBottom: 48 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.card },
  dotActive: { backgroundColor: Colors.primary },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 15,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
