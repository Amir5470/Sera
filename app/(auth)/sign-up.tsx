import * as Google from 'expo-auth-session/providers/google'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { useState } from 'react'
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { signUp } from '../../lib/auth'
import { auth } from '../../lib/firebase'

WebBrowser.maybeCompleteAuthSession()

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '608393229921-8nvoncoq09k3tae8d0lii7j16nbtd645.apps.googleusercontent.com',
    webClientId: '608393229921-p0gdis6scsnl2r0j5njajhv3mjv6kev6.apps.googleusercontent.com',
    responseType: 'id_token',
  })

  const handleGoogleSignUp = async () => {
    const result = await promptAsync()
    if (result?.type === 'success') {
      const { id_token } = result.params
      const credential = GoogleAuthProvider.credential(id_token)
      try {
        await signInWithCredential(auth, credential)
      } catch (e: any) {
        Alert.alert('Error', e.message)
      }
    }
  }

  const handleSignUp = async () => {
    try {
      await signUp(email, password)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/Sera logo B.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.tagline}>Join your school.</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.muted}
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.muted}
        value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/sign-in' as any)}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background2, justifyContent: 'center', padding: 24 },
  logo: { width: '100%', height: 80, marginBottom: 8 },
  tagline: { color: Colors.muted, textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: Colors.card, color: Colors.text, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  googleButton: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: Colors.border },
  googleButtonText: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  link: { color: Colors.muted, textAlign: 'center', marginTop: 20 },
})