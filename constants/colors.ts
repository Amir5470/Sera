const dark = {
  background: "#0D0A1A",
  primary: "#F97316",
  secondary: "#FFD166",
  text: "#FFFFFF",
  muted: "rgba(255, 255, 255, 0.45)",
  card: "#1A1530",
  border: "rgba(255,255,255,0.1)",
  background2: "#000000",
};

const light = {
  background: "#FFFFFF",
  primary: "#F97316",
  secondary: "#FFD166",
  text: "#0B1020",
  muted: "rgba(11,16,32,0.45)",
  card: "#FFFFFF",
  border: "rgba(11,16,32,0.06)",
  background2: "#F6F7FB",
};

// Mutable Colors object imported across the app. Theme switching mutates this object in place
// so existing imports see updated values without needing to re-import.
export const Colors: Record<string, string> = { ...dark };

export const palettes = { dark, light };

export const applyTheme = (name: "dark" | "light") => {
  const source = name === "light" ? light : dark;
  Object.keys(Colors).forEach((k) => delete (Colors as any)[k]);
  Object.assign(Colors, source);
};

// default to dark palette
applyTheme("dark");
