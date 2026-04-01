import { useRouter } from 'expo-router'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors } from '../constants/colors'

export default function Index() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Sera-Logo-Transparent-Wtext.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(auth)/sign-in')}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondary}
        onPress={() => router.push('/(auth)/sign-up')}
      >
        <Text style={styles.secondaryText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background2,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 40,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  secondary: {
    padding: 16,
  },
  secondaryText: {
    color: Colors.muted,
  },
  logo: {
    width: '100%',
    height: 80,
    marginBottom: 8,
  },
})