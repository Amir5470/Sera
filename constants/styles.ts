import { Dimensions, Platform, StyleSheet } from "react-native";
import { Colors } from "./colors";
const { width } = Dimensions.get("window");

export const classstyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: { paddingVertical: 4 },
  backText: { color: Colors.primary, fontWeight: "700", fontSize: 20 },
  headerText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    maxWidth: width * 0.6,
  },
  onlineStatus: { color: "#4ADE80", fontSize: 11, fontWeight: "600" },

  listContent: { padding: 16, paddingBottom: 30, gap: 12 },

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
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 60,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

export const clubstyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: { paddingVertical: 4 },
  backText: { color: Colors.primary, fontWeight: "700", fontSize: 20 },
  headerText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    maxWidth: width * 0.6,
  },

  listContent: { padding: 16, paddingBottom: 30, gap: 12 },

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
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 60,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
