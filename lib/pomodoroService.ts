import { Platform } from "react-native";

export default async function promptDoNotDisturb(): Promise<void> {
  try {
    // Try dynamic import of react-native-permissions (if the project has it installed)
    // and request whatever relevant permission is available. Many platforms require
    // manual user enablement for Do Not Disturb, so fall back to opening settings.
    // This function errs on the side of non-fatal failure and always returns.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const maybe = require("react-native-permissions");
    if (maybe && maybe.check && maybe.request) {
      try {
        // There is no single cross-platform DND permission in the library;
        // attempt common Android permission and otherwise open settings.
        if (Platform.OS === "android") {
          // ACCESS_NOTIFICATION_POLICY is the system-level DND permission on Android.
          // react-native-permissions may not expose it; if it does, request it.
          // If request is not possible, fall back to opening settings.
          const ANDROID_DND = "android.permission.ACCESS_NOTIFICATION_POLICY";
          try {
            await maybe.request(ANDROID_DND);
            return;
          } catch (e) {
            // fall through
          }
        }
      } catch (e) {
        // fall through to opening settings
      }
    }
  } catch (err) {
    // library not installed — proceed to fallback
  }

  // Fallback: do nothing. We avoid opening settings or showing prompts automatically
  // to prevent interrupting the user. The app can provide a manual 'Open Settings'
  // action elsewhere if needed.
  return;
}
