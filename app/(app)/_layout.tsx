import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Colors } from '../../constants/colors'

export default function AppLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.muted,
    }}>
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes', tabBarIcon: ({ color }) => <Ionicons name="book" size={22} color={color} /> }} />
      <Tabs.Screen name="clubs" options={{ title: 'Clubs', tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }} />
    </Tabs>
  )
}