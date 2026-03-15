export type UiPrefs = {
  supportiveReminders: boolean;
  alwaysShowCrisisLink: boolean;
  enterToSend: boolean;
  showTimestamps: boolean;
  compactThreads: boolean;
  reduceMotion: boolean;
};

export const UI_PREFS_KEY = "waypoint_ui_prefs_v2";

export const DEFAULT_UI_PREFS: UiPrefs = {
  supportiveReminders: true,
  alwaysShowCrisisLink: true,
  enterToSend: true,
  showTimestamps: true,
  compactThreads: false,
  reduceMotion: false,
};

export function loadUiPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return DEFAULT_UI_PREFS;

    return {
      ...DEFAULT_UI_PREFS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_UI_PREFS;
  }
}

export function saveUiPrefs(prefs: UiPrefs) {
  try {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

export function applyUiPrefsToDocument(prefs: UiPrefs) {
  document.documentElement.setAttribute(
    "data-reduce-motion",
    prefs.reduceMotion ? "true" : "false"
  );
}