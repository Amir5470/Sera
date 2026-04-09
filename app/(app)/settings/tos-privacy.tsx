import { PressableScale } from "@/components/animated-helpers";
import { Colors } from "@/constants/colors";
import { classstyles } from "@/constants/styles";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type TabType = "tos" | "privacy";

export default function TosPrivacyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("tos");

  const url =
    activeTab === "tos"
      ? "https://serahq.online/tos#title"
      : "https://serahq.online/policy#title";

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    setLoading(true);
    setError(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()}>
          <Text style={classstyles.backText}>← Back</Text>
        </PressableScale>

        <View style={styles.tabContainer}>
          <PressableScale
            style={[styles.tab, activeTab === "tos" && styles.tabActive]}
            onPress={() => handleTabSwitch("tos")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "tos" && styles.tabTextActive,
              ]}
            >
              Terms of Service
            </Text>
          </PressableScale>

          <PressableScale
            style={[styles.tab, activeTab === "privacy" && styles.tabActive]}
            onPress={() => handleTabSwitch("privacy")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "privacy" && styles.tabTextActive,
              ]}
            >
              Privacy Policy
            </Text>
          </PressableScale>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load content</Text>
          <PressableScale
            style={styles.retryButton}
            onPress={() => {
              setError(false);
              setLoading(true);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </PressableScale>
        </View>
      )}

      <WebView
        key={url} // Force remount when URL changes
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        startInLoadingState={true}
        renderLoading={() => <View style={styles.loadingContainer}></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    color: Colors.muted,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
