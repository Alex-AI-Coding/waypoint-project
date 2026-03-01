export type ThemePref = "light" | "dark" | "system";
export type TonePref = "calm" | "gentle" | "direct";
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
  tone: "calm",
  font_size: "md",
  font_style: "system",
};

const STORAGE_KEY = "waypoint_settings_v1";

export function loadSettingsFromStorage(): UserSettings {
  try {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: UserSettings) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage failures (private mode, blocked storage, etc.)
  }
}

/* ===============================
   APPLY SETTINGS TO DOCUMENT
   - Theme (light/dark/system)
   - Font size
   - Font style
================================ */

let media: MediaQueryList | null = null;
let attachedHandler: ((e: MediaQueryListEvent) => void) | null = null;

export function applySettingsToDocument(settings: UserSettings) {
  if (typeof document === "undefined") return;

  // Setup media query once (client-only)
  if (!media && typeof window !== "undefined" && window.matchMedia) {
    media = window.matchMedia("(prefers-color-scheme: dark)");
  }

  const applyTheme = () => {
    const prefersDark = !!media?.matches;

    const resolvedTheme =
      settings.theme === "system"
        ? prefersDark
          ? "dark"
          : "light"
        : settings.theme;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  };

  // Always apply now
  applyTheme();

  // Attach/detach listener based on current theme selection
  // So "system" reacts live, but "light/dark" does not keep unnecessary listeners.
  if (media) {
    if (settings.theme === "system") {
      if (!attachedHandler) {
        attachedHandler = () => applyTheme();
        media.addEventListener("change", attachedHandler);
      }
    } else {
      if (attachedHandler) {
        media.removeEventListener("change", attachedHandler);
        attachedHandler = null;
      }
    }
  }

  // Font size (via data attribute)
  document.documentElement.setAttribute("data-font-size", settings.font_size);

  // Font style (via data attribute)
  document.documentElement.setAttribute("data-font-style", settings.font_style);
}