export type ThemePref = "system" | "light" | "dark";
export type TonePref = "gentle" | "calm" | "direct";
export type FontSizePref = "sm" | "md" | "lg" | "xl";
export type FontStylePref = "system" | "lexend" | "atkinson";

export type WaypointSettings = {
  theme: ThemePref;
  tone: TonePref;
  font_size: FontSizePref;
  font_style: FontStylePref;
};

export const DEFAULT_SETTINGS: WaypointSettings = {
  theme: "system",
  tone: "gentle",
  font_size: "md",
  font_style: "system",
};

export const SETTINGS_KEY = "waypoint_settings_v1";

export function loadSettingsFromStorage(): WaypointSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(s: WaypointSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

export function applySettingsToDocument(s: WaypointSettings) {
  const root = document.documentElement;

  // Theme
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark = s.theme === "dark" || (s.theme === "system" && prefersDark);

  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");

  // Font size
  let px = 16;
  if (s.font_size === "sm") px = 14;
  if (s.font_size === "md") px = 16;
  if (s.font_size === "lg") px = 18;
  if (s.font_size === "xl") px = 20;
  root.style.fontSize = `${px}px`;

  // Font style
  if (s.font_style === "system") {
    root.style.fontFamily = "";
  } else if (s.font_style === "lexend") {
    root.style.fontFamily =
      "Lexend, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  } else if (s.font_style === "atkinson") {
    root.style.fontFamily =
      "Atkinson Hyperlegible, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  }
}