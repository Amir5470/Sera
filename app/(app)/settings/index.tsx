import { PressableScale } from "@/components/animated-helpers";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { logOut } from "@/lib/auth";
import { deleteAccount } from "@/lib/deleteAccount";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your profile, schedule, posts, and all school data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            if (!user?.uid || !profile?.schoolId) {
              Alert.alert(
                "Error",
                "Could not delete account. Please try again.",
              );
              return;
            }

            setDeleting(true);
            try {
              await deleteAccount(user.uid, profile.schoolId);
              // User is now logged out automatically by deleteUser()
              router.replace("/(auth)/sign-in" as any);
            } catch (error: any) {
              setDeleting(false);
              Alert.alert(
                "Error",
                error.message || "Failed to delete account. Please try again.",
              );

              Alert.prompt(
                "Final Confirmation",
                "Please enter your password to confirm account deletion. This cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete Permanently",
                    style: "destructive",
                    onPress: async (password?: string) => {
                      if (!password) {
                        Alert.alert(
                          "Error",
                          "Password is required to delete account.",
                        );
                        return;
                      }
                      setDeleting(true);
                      try {
                        await deleteAccount(
                          user!.uid,
                          profile!.schoolId,
                          password,
                        );
                        router.replace("/(auth)/sign-in" as any);
                      } catch (e: any) {
                        setDeleting(false);
                        Alert.alert("Deletion Failed", e.message);
                      }
                    },
                  },
                ],
                "secure-text",
              );
            }
          },
        },
      ],
    );
  };

  const SettingsItem = ({
    icon,
    label,
    onPress,
    color = Colors.text,
    subtext = "",
  }: any) => (
    <PressableScale style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuText, { color }]}>{label}</Text>
          {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
    </PressableScale>
  );

  if (deleting) {
    return (
      <View style={styles.deletingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.deletingText}>Deleting your account...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={Colors.muted} />
          </View>
          <View>
            <Text style={styles.userName}>
              {profile?.displayName || "Student"}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingsItem
            icon="person-outline"
            label="Edit Profile"
            subtext="Name, username, grade"
            onPress={() =>
              router.push({
                pathname: "/settings/edit-profile",
                params: { edit: "true" },
              } as any)
            }
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="school-outline"
            label="Edit School"
            subtext="School name and city"
            onPress={() =>
              router.push({
                pathname: "/settings/edit-school",
                params: { edit: "true" },
              } as any)
            }
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="notifications-outline"
            label="Notifications"
            subtext="Manage your alerts"
            onPress={() =>
              router.push({
                pathname: "/settings/notifications",
                params: { edit: "true" },
              } as any)
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.card}>
          <SettingsItem
            icon="calendar-outline"
            label="Manage Classes"
            subtext="Add, remove, or rescan your schedule"
            onPress={() => router.push("/(app)/schedule" as any)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.card}>
          <SettingsItem
            icon="document-text-outline"
            label="Legal"
            onPress={() => router.push("/settings/tos-privacy" as any)}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="log-out-outline"
            label="Sign Out"
            color="#FF4444"
            onPress={handleSignOut}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: "#FF4444" }]}>
          Danger Zone
        </Text>
        <View
          style={[
            styles.card,
            { borderColor: "rgba(255, 68, 68, 0.2)", borderWidth: 1 },
          ]}
        >
          <SettingsItem
            icon="trash-outline"
            label="Delete Account"
            color="#FF4444"
            subtext="Permanently remove your data"
            onPress={handleDeleteAccount}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    marginLeft: 4,
  },
  card: { backgroundColor: Colors.card, borderRadius: 16, overflow: "hidden" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: { color: Colors.text, fontSize: 18, fontWeight: "600" },
  userEmail: { color: Colors.muted, fontSize: 14, marginTop: 2 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuTextContainer: { gap: 2 },
  menuText: { fontSize: 16, fontWeight: "500" },
  subtext: { color: Colors.muted, fontSize: 12 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 50 },
  version: {
    color: Colors.muted,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 20,
    fontSize: 12,
  },
  deletingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  deletingText: {
    color: Colors.muted,
    fontSize: 16,
    marginTop: 12,
  },
});
