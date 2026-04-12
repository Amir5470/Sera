import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";
import Screen from "@/components/ui/Screen"; // components/ui/Screen.tsx:6-14
import { Colors } from "@/constants/colors";

type NoSchoolStateProps = {
  onSearch: (e?: GestureResponderEvent) => void;
  onCreate: (e?: GestureResponderEvent) => void;
  onInvite?: (e?: GestureResponderEvent) => void;
  compact?: boolean;
};

export default function NoSchoolState({
  onSearch,
  onCreate,
  onInvite,
  compact = false,
}: NoSchoolStateProps) {
  const Headline = () => (
    <Text
      accessibilityRole="header"
      style={[styles.headline, compact && styles.headlineCompact]}
    >
      🏫 Your school, all in one place.
    </Text>
  );

  const Subheading = () => (
    <Text
      style={[styles.subheading, compact && styles.subheadingCompact]}
      accessibilityLabel="See schedules, join classes, and follow the school feed"
    >
      {compact
        ? "Find your school to join classes and the school feed."
        : "See schedules, join classes, and follow the school feed — student-led and ad-free."}
    </Text>
  );

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );

  return (
    <Screen>
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Headline />
        <Subheading />

        {!compact && (
          <View style={styles.bullets}>
            <Bullet>Auto-generated class rooms from your schedule.</Bullet>
            <Bullet>School-wide posts, clubs, and events you actually care about.</Bullet>
          </View>
        )}

        <View style={styles.ctaRow}>
          <TouchableOpacity
            onPress={onSearch}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Find your school"
          >
            <Text style={styles.primaryButtonText}>Find your school</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCreate}
            style={styles.secondaryButton}
            accessibilityRole="button"
            accessibilityLabel="Create a school"
          >
            <Text style={styles.secondaryButtonText}>Create a school</Text>
          </TouchableOpacity>
        </View>

        {onInvite ? (
          <TouchableOpacity
            onPress={onInvite}
            accessibilityRole="button"
            accessibilityLabel="Invite classmates"
            style={styles.inviteLink}
          >
            <Text style={styles.inviteText}>Invite classmates</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "stretch",
    margin: 16,
  },
  containerCompact: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 12,
  },
  headline: {
    color: Colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    marginBottom: 8,
  },
  headlineCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  subheading: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  subheadingCompact: {
    fontSize: 13,
    marginBottom: 12,
  },
  bullets: {
    marginBottom: 18,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  ctaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },
  primaryButtonText: {
    color: Colors.background2 === "#000000" ? Colors.background : Colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
  inviteLink: {
    marginTop: 14,
    alignSelf: "center",
    padding: 6,
  },
  inviteText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
});