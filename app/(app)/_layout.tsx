import { Ionicons } from '@expo/vector-icons'
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import { useRouter } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { useProfile } from '../../hooks/useProfile'

function CustomDrawerContent(props: any) {
  const { profile } = useProfile()
  const router = useRouter()

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: Colors.background }}
    >
      {/* Profile header */}
      <View style={styles.drawerHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={30} color={Colors.muted} />
        </View>
        <Text style={styles.userName}>
          {profile?.displayName || 'Student'}
        </Text>
        <Text style={styles.userSchool}>
          {profile?.school || ''}
        </Text>
      </View>

      {/* Nav items */}
      <View style={styles.drawerList}>
        <DrawerItemList {...props} />
      </View>

      {/* Settings pinned to bottom */}
      <Pressable
        style={styles.settingsRow}
        onPress={() => router.push('/(app)/settings' as any)}
      >
        <Ionicons name="settings-outline" size={22} color={Colors.muted} />
        <Text style={styles.settingsText}>Settings</Text>
      </Pressable>
    </DrawerContentScrollView>
  )
}

export default function AppLayout() {
    const { profile } = useProfile()
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.muted,
        drawerStyle: {
          backgroundColor: Colors.background,
          width: 280,
        },
      }}
    >
      <Drawer.Screen
        name="feed"
        options={{
          drawerLabel: 'Feed',
          title: profile?.school?.replace(' High School', '').trim() || 'Sera',
          drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="schedule"
        options={{
          drawerLabel: 'Schedule',
          title: 'Schedule',
          drawerIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="classes"
        options={{
          drawerLabel: 'Classes',
          title: 'Classes',
          drawerIcon: ({ color }) => <Ionicons name="book-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="clubs"
        options={{
          drawerLabel: 'Clubs',
          title: 'Clubs',
          drawerIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: () => null,
          drawerItemStyle: { display: 'none' },
          title: 'Settings',
        }}
      />
    </Drawer>
  )
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4, },
  userSchool: { color: Colors.muted, fontSize: 14 },
  drawerList: { flex: 1 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  settingsText: { color: Colors.muted, fontSize: 16, fontWeight: '500' },
})