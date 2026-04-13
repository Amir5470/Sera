import { PressableScale } from "@/components/animated-helpers";
import { classstyles } from "@/constants/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { saveProfile } from "../../lib/profile";
import { findOrCreateSchool, searchSchools } from "../../lib/schools";

const GRADES = ["9th", "10th", "11th", "12th"];

export default function Step3() {
  const { user } = useAuth();
  const router = useRouter();
  const { edit } = useLocalSearchParams() as { edit?: string };
  const isEdit = edit === "true";
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { id: string; name: string; city: string }[]
  >([]);
  const [schoolSelected, setSchoolSelected] = useState(false);

  useEffect(() => {
    if (schoolSelected) return;
    const timeout = setTimeout(async () => {
      const results = await searchSchools(school);
      setSuggestions(results);
    }, 300);
    return () => clearTimeout(timeout);
  }, [school]);

  const selectSchool = (s: { id: string; name: string; city: string }) => {
    setSchool(s.name);
    setCity(s.city);
    setSuggestions([]);
    setSchoolSelected(true);
  };

  const next = async () => {
    if (!school.trim() || !city.trim() || !grade) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }
    if (!user) return;
    setLoading(true);
    const schoolId = await findOrCreateSchool(school, city);
    // Use atomic save to avoid partial profile state (userIndex updated without school membership)
    await saveProfile(user.uid, schoolId, {
      school: school.trim(),
      city: city.trim(),
      grade,
    });
    if (isEdit) {
      router.replace("/(app)/settings" as any);
    } else {
      router.push("/(onboarding)/step4" as any);
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <Text style={classstyles.headerText}>Your school</Text>
      <Text style={styles.subtitle}>
        Help us connect you with your school community.
      </Text>

      <View style={styles.autocompleteContainer}>
        <TextInput
          style={classstyles.input}
          placeholder="School name (e.g. West Jefferson High School)"
          placeholderTextColor={Colors.muted}
          value={school}
          onChangeText={(t) => {
            setSchool(t);
            setSchoolSelected(false);
          }}
        />
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <PressableScale
                key={s.id}
                style={styles.suggestion}
                onPress={() => selectSchool(s)}
              >
                <Text style={styles.suggestionName}>{s.name}</Text>
                <Text style={styles.suggestionCity}>{s.city}</Text>
              </PressableScale>
            ))}
          </View>
        )}
      </View>

      <TextInput
        style={classstyles.input}
        placeholder="City (e.g. Chicago, IL)"
        placeholderTextColor={Colors.muted}
        value={city}
        onChangeText={setCity}
      />

      <Text style={styles.label}>Grade</Text>
      <View style={styles.gradeRow}>
        {GRADES.map((g) => (
          <PressableScale
            key={g}
            style={[
              styles.gradeButton,
              grade === g && styles.gradeButtonActive,
            ]}
            onPress={() => setGrade(g)}
          >
            <Text
              style={[styles.gradeText, grade === g && styles.gradeTextActive]}
            >
              {g}
            </Text>
          </PressableScale>
        ))}
      </View>

      <PressableScale
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={next}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{isEdit ? "Save" : "Next →"}</Text>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 80,
  },
  progress: { flexDirection: "row", gap: 8, marginBottom: 48 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.card },
  dotActive: { backgroundColor: Colors.primary },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: { color: Colors.muted, fontSize: 15, marginBottom: 32 },
  autocompleteContainer: { position: "relative", zIndex: 10, marginBottom: 12 },
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
  suggestions: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: "hidden",
  },
  suggestion: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionName: { color: Colors.text, fontWeight: "600", fontSize: 14 },
  suggestionCity: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  label: {
    color: Colors.text,
    fontWeight: "600",
    marginBottom: 12,
    fontSize: 15,
  },
  gradeRow: { flexDirection: "row", gap: 10, marginBottom: 32 },
  gradeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  gradeText: { color: Colors.muted, fontWeight: "600" },
  gradeTextActive: { color: "#fff" },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
