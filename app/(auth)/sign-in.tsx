import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";
import { useTheme } from "../../hooks/useTheme";
import { signIn } from "../../lib/auth";
import { auth } from "../../lib/firebase";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: Colors.background2,
          justifyContent: "center",
          padding: 24,
        },
        logo: {
          width: "100%",
          height: 80,
          marginBottom: 8,
        },
        tagline: {
          color: Colors.muted,
          textAlign: "center",
          marginBottom: 40,
        },
        input: {
          backgroundColor: Colors.card,
          color: Colors.text,
          padding: 16,
          borderRadius: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        button: {
          backgroundColor: Colors.primary,
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 8,
        },
        buttonText: {
          color: Colors.text,
          fontWeight: "bold",
          fontSize: 16,
        },
        googleButton: {
          backgroundColor: Colors.card,
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 12,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        googleButtonText: {
          color: Colors.text,
          fontWeight: "bold",
          fontSize: 16,
        },
        link: {
          color: Colors.muted,
          textAlign: "center",
          marginTop: 20,
        },
      }),
    [theme],
  );

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      "608393229921-8nvoncoq09k3tae8d0lii7j16nbtd645.apps.googleusercontent.com",
    webClientId:
      "608393229921-p0gdis6scsnl2r0j5njajhv3mjv6kev6.apps.googleusercontent.com",
    androidClientId:
      "608393229921-3q8kch36dgje489i2he4svsobi2jv6qp.apps.googleusercontent.com",
  });

  // Handle Google response properly
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success") {
        try {
          const { id_token } = response.params;
          const credential = GoogleAuthProvider.credential(id_token);
          await signInWithCredential(auth, credential);
        } catch (e: any) {
          Alert.alert("Google Sign-In Error", e.message);
        }
      }
    };

    handleGoogleResponse();
  }, [response]);

  const handleEmailSignIn = async () => {
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert("Sign In Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/Sera logo B.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.tagline}>Your school, all in one place.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={Colors.muted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={Colors.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleEmailSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      {Platform.OS !== "android" && (
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.push("/(auth)/sign-up" as any)}>
        <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles are created inside the component with `useMemo` so they update when
// the active theme changes. The previous module-level `styles` export was
// removed to avoid stale Colors values.
