import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useMemo } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";
import { useProfile } from "../../hooks/useProfile";
import { palettes, ThemeProvider, useTheme } from "../../hooks/useTheme";

function CustomDrawerContent(props: any) {
  const { profile } = useProfile();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const localStyles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: Colors.background },
        drawerHeader: {
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          marginBottom: 10,
        },
        avatar: {
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: Colors.card,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        },
        userName: {
          color: Colors.text,
          fontSize: 18,
          fontWeight: "700",
          marginBottom: 4,
        },
        userSchool: { color: Colors.muted, fontSize: 14 },
        drawerList: { flex: 1 },
        settingsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
        settingsText: { color: Colors.muted, fontSize: 16, fontWeight: "500" },
        settingsFooterRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
          paddingBottom: 12,
        },
        themeToggle: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
      }),
    [theme],
  );

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={localStyles.container}
    >
      {/* Profile header */}
      <View style={localStyles.drawerHeader}>
        <View style={localStyles.avatar}>
          <Ionicons name="person" size={30} color={Colors.muted} />
        </View>
        <Text style={localStyles.userName}>
          {profile?.displayName || "Student"}
        </Text>
        <Text style={localStyles.userSchool}>{profile?.school || ""}</Text>
      </View>

      {/* Nav items */}
      <View style={localStyles.drawerList}>
        <DrawerItemList {...props} />
      </View>

      {/* Settings pinned to bottom */}
      <View style={localStyles.settingsFooterRow}>
        <Pressable
          style={localStyles.settingsRow}
          onPress={() => router.push("/(app)/settings" as any)}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.muted} />
          <Text style={localStyles.settingsText}>Settings</Text>
        </Pressable>

        <Pressable style={localStyles.themeToggle} onPress={() => toggle()}>
          <Ionicons
            name={theme === "light" ? "sunny-outline" : "moon-outline"}
            size={18}
            color={Colors.muted}
          />
          <Text style={localStyles.settingsText}>
            {theme === "light" ? "Light" : "Dark"}
          </Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  const { profile } = useProfile();
  return (
    <ThemeProvider>
      <AppDrawer profile={profile} />
    </ThemeProvider>
  );
}

function AppDrawer({ profile }: { profile: any }) {
  const { animatedValue, theme } = useTheme();
  const overlayColor =
    theme === "light" ? palettes.light.background : palettes.dark.background;
  const overlayOpacity = animatedValue;

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: overlayColor, opacity: overlayOpacity },
        ]}
      />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme === "light" ? "#FFFFFF" : "#0D0A1A",
          },
          headerTintColor: theme === "light" ? "#0B1020" : "#FFFFFF",
          drawerActiveTintColor: theme === "light" ? "#F97316" : "#F97316",
          drawerInactiveTintColor:
            theme === "light"
              ? "rgba(11,16,32,0.45)"
              : "rgba(255,255,255,0.45)",
          drawerStyle: {
            backgroundColor: theme === "light" ? "#FFFFFF" : "#0D0A1A",
            width: 280,
          },
        }}
      >
        <Drawer.Screen
          name="feed"
          options={{
            drawerLabel: "Feed",
            title:
              profile?.school?.replace(" High School", "").trim() || "Sera",
            drawerIcon: ({ color }) => (
              <Ionicons name="home-outline" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="schedule"
          options={{
            drawerLabel: "Schedule",
            title: "Schedule",
            drawerIcon: ({ color }) => (
              <Ionicons name="calendar-outline" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="calendar"
          options={{
            drawerLabel: "Calendar",
            title: "Calendar",
            drawerIcon: ({ color }) => (
              <Ionicons name="calendar-clear-outline" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="classes"
          options={{
            drawerLabel: "Classes",
            title: "Classes",
            drawerIcon: ({ color }) => (
              <Ionicons name="book-outline" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="clubs"
          options={{
            drawerLabel: "Clubs",
            title: "Clubs",
            drawerIcon: ({ color }) => (
              <Ionicons name="people-outline" size={22} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: () => null,
            drawerItemStyle: { display: "none" },
            title: "Settings",
          }}
        />
      </Drawer>
    </View>
  );
}

// Module-level styles were duplicated by `localStyles` and referenced Colors
// directly which prevented immediate theme reactivity. The styles below were
// removed in favor of the `useMemo`-created `localStyles` used inside the
// `CustomDrawerContent` component so the UI updates immediately when theme
// changes.
