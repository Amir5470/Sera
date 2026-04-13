import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PressableScale } from "../../components/animated-helpers";
import { Colors } from "../../constants/colors";
import { resolvePickedImage } from "../../lib/imagePickBridge";

export default function DebugImagePicker() {
  const [busy, setBusy] = useState(false);
  const [asset, setAsset] = useState<any>(null);
  const [base64Len, setBase64Len] = useState<number | null>(null);

  const runAfterInteractions = async (fn: () => Promise<void>) =>
    new Promise<void>((res) =>
      InteractionManager.runAfterInteractions(async () => {
        await fn();
        res();
      }),
    );

  const launch = async (useCamera: boolean) => {
    console.log("DEBUG: DebugImagePicker launch", { useCamera });
    setBusy(true);
    await runAfterInteractions(async () => {
      try {
        const perm = useCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log("DEBUG: permission", perm);
        if (perm.status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Please grant permissions in Settings.",
          );
          return;
        }

        const opts: any = { quality: 0.7, base64: true };
        const result: any = useCamera
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
        console.log("DEBUG: launch result", {
          canceled: result.canceled ?? result.cancelled,
          assets: result.assets?.length ?? 0,
        });
        if (result.canceled || result.cancelled || !result.assets?.[0]) {
          setAsset(null);
          setBase64Len(null);
          // resolve bridge with null to indicate cancel
          try {
            resolvePickedImage(null);
          } catch {}
          return;
        }
        const a = result.assets[0];
        setAsset(a);
        setBase64Len(a.base64?.length ?? null);
        try {
          resolvePickedImage({ uri: a.uri, base64: a.base64 });
        } catch {}
      } catch (e) {
        console.error("DebugImagePicker error", e);
        Alert.alert("Error", String(e));
      } finally {
        setBusy(false);
      }
    });
  };

  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // auto-launch when navigated with ?auto=true&useCamera=true|false
    const auto = params?.auto === "true";
    const useCamera = params?.useCamera === "true";
    if (auto) {
      (async () => {
        await launch(useCamera);
        // after picking (or cancel), go back
        try {
          router.back();
        } catch (e) {
          console.warn("router.back failed", e);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Debug ImagePicker</Text>
        <Text style={styles.subtitle}>
          Use these buttons to test ImagePicker outside any modal/animation.
        </Text>
        <View style={styles.row}>
          <PressableScale style={styles.button} onPress={() => launch(true)}>
            <Text style={styles.buttonText}>Launch Camera</Text>
          </PressableScale>
          <PressableScale
            style={[styles.button, { borderColor: Colors.primary }]}
            onPress={() => launch(false)}
          >
            <Text style={[styles.buttonText, { color: Colors.primary }]}>
              Launch Library
            </Text>
          </PressableScale>
        </View>

        <View style={{ marginTop: 16 }}>
          {busy ? <ActivityIndicator color={Colors.primary} /> : null}
          <Text style={styles.info}>Base64 length: {base64Len ?? "—"}</Text>
          <Text style={styles.info}>URI: {asset?.uri ?? "—"}</Text>
          {asset?.uri ? (
            <Image source={{ uri: asset.uri }} style={styles.preview} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: { color: Colors.muted, marginBottom: 16 },
  row: { flexDirection: "row", gap: 12 },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: { color: Colors.text, fontWeight: "700" },
  info: { color: Colors.muted, marginTop: 8 },
  preview: { width: "100%", height: 300, marginTop: 12, borderRadius: 12 },
});
