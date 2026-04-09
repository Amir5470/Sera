import { PressableScale } from "@/components/animated-helpers";
import { Colors } from "@/constants/colors";
import { classstyles } from "@/constants/styles";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AppearanceScreen() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const stylesMemo = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
        headerRow: { marginTop: 24, marginBottom: 12 },
        header: { color: Colors.text, fontSize: 24, fontWeight: "800" },
        card: { backgroundColor: Colors.card, borderRadius: 14, padding: 12 },
        option: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 12,
        },
        optionActive: { backgroundColor: Colors.background2, borderRadius: 10 },
        optionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
        optionText: { color: Colors.text, fontWeight: "700", fontSize: 16 },
        optionMeta: { color: Colors.muted },
        divider: { height: 1, backgroundColor: Colors.border },
        hintRow: { marginTop: 18 },
        hintTitle: {
          color: Colors.secondary,
          fontWeight: "800",
          marginBottom: 6,
        },
        hintText: { color: Colors.muted },
        backButton: {
          marginTop: 20,
          backgroundColor: Colors.primary,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        },
        backText: { color: Colors.text, fontWeight: "700" },
      }),
    [theme],
  );

  return (
    <View style={stylesMemo.container}>
      <View style={stylesMemo.headerRow}>
        <Text style={classstyles.headerText}>Appearance</Text>
      </View>

      <View style={stylesMemo.card}>
        <PressableScale
          style={[
            stylesMemo.option,
            theme === "light" && stylesMemo.optionActive,
          ]}
          onPress={() => theme === "dark" && toggle()}
        >
          <View style={stylesMemo.optionLeft}>
            <Ionicons name="sunny-outline" size={22} color={Colors.primary} />
            <Text style={stylesMemo.optionText}>Light</Text>
          </View>
          <Text style={stylesMemo.optionMeta}>
            {theme === "light" ? "Selected" : ""}
          </Text>
        </PressableScale>

        <View style={stylesMemo.divider} />

        <PressableScale
          style={[
            stylesMemo.option,
            theme === "dark" && stylesMemo.optionActive,
          ]}
          onPress={() => theme === "light" && toggle()}
        >
          <View style={stylesMemo.optionLeft}>
            <Ionicons name="moon-outline" size={22} color={Colors.muted} />
            <Text style={stylesMemo.optionText}>Dark</Text>
          </View>
          <Text style={stylesMemo.optionMeta}>
            {theme === "dark" ? "Selected" : ""}
          </Text>
        </PressableScale>
      </View>

      <View style={stylesMemo.hintRow}>
        <Text style={stylesMemo.hintTitle}>Tip</Text>
        <Text style={stylesMemo.hintText}>
          You can also toggle the theme quickly from the drawer by tapping the
          Light/Dark control in the bottom-left.
        </Text>
      </View>

      <PressableScale
        style={classstyles.backButton}
        onPress={() => router.back()}
      >
        <Text style={classstyles.backText}>Back</Text>
      </PressableScale>
    </View>
  );
}

// styles recreated via useMemo above; no module-level styles
