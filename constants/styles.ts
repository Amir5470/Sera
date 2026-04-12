import { Dimensions, Platform, StyleSheet } from "react-native";
import { Colors } from "./colors";
const { width } = Dimensions.get("window");

// Centralized, shared UI tokens for headers, back/send buttons, composers, etc.
export const sharedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  // Header
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: { paddingVertical: 4 },
  backText: { color: Colors.primary, fontWeight: "700", fontSize: 18 },
  headerText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    maxWidth: width * 0.6,
  },
  onlineStatus: { color: "#4ADE80", fontSize: 11, fontWeight: "600" },

  listContent: { padding: 16, paddingBottom: 30, gap: 12 },

  // Chat bubbles
  bubble: {
    maxWidth: "82%",
    padding: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    boxShadow: "0px 1px 4px rgba(0,0,0,0.05)",
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.card,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  author: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  messageText: { color: Colors.text, fontSize: 15, lineHeight: 20 },

  time: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  timeMe: { color: "rgba(255,255,255,0.7)" },
  timeThem: { color: Colors.muted },

  emptyText: {
    color: Colors.muted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },

  // Composer
  composer: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 24,
    fontSize: 15,
    minHeight: 30,
    height: "auto",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    marginBottom: Platform.OS === "ios" ? 6 : 0,
  },
  // Primary send button used across composers
  sendButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    width: "auto",
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: Colors.text, fontWeight: "700", fontSize: 14 },
});

// Keep previous named exports for compatibility but point them to the shared styles
export const classstyles = sharedStyles;
export const clubstyles = sharedStyles;
