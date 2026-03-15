export type ThemePref = "system" | "light" | "dark";
export type TonePref = "gentle" | "calm" | "direct";
export type FontSizePref = "sm" | "md" | "lg" | "xl";
export type FontStylePref = "system" | "lexend" | "atkinson";

export type UserSettings = {
  theme: ThemePref;
  tone: TonePref;
  font_size: FontSizePref;
  font_style: FontStylePref;
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  tone: "gentle",
  font_size: "md",
  font_style: "system",
};

export const SETTINGS_KEY = "waypoint_settings_v1";

export function loadSettingsFromStorage(): UserSettings {
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

export function saveSettingsToStorage(settings: UserSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function applySettingsToDocument(settings: UserSettings) {
  const root = document.documentElement;

  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" && prefersDark);

  root.classList.toggle("dark", isDark);
  root.setAttribute("data-font-size", settings.font_size);
  root.setAttribute("data-font-style", settings.font_style);
}