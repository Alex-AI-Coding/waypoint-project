"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import Card from "@/components/Card";
import Header from "@/components/Header";
import DisclaimerBox from "@/components/DisclaimerBox";
import { createClient } from "@/lib/supabase/browser";
import {
  DEFAULT_SETTINGS,
  applySettingsToDocument,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  type ThemePref,
  type TonePref,
  type FontSizePref,
  type FontStylePref,
} from "./settingsClient";

type Status = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  // ✅ IMPORTANT: load from localStorage immediately (no default flash)
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    return loadSettingsFromStorage();
  });

  // Optional toggles (local-only)
  const [supportiveReminders, setSupportiveReminders] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = localStorage.getItem("waypoint_ui_prefs_v1");
      if (!raw) return true;
      const p = JSON.parse(raw);
      return p.supportiveReminders ?? true;
    } catch {
      return true;
    }
  });

  const [alwaysShowCrisisLink, setAlwaysShowCrisisLink] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = localStorage.getItem("waypoint_ui_prefs_v1");
      if (!raw) return true;
      const p = JSON.parse(raw);
      return p.alwaysShowCrisisLink ?? true;
    } catch {
      return true;
    }
  });

  const [status, setStatus] = useState<Status>("idle");

  const themeOptions: ThemePref[] = ["system", "light", "dark"];
  const toneOptions: TonePref[] = ["gentle", "calm", "direct"];
  const sizeOptions: FontSizePref[] = ["sm", "md", "lg", "xl"];
  const fontOptions: FontStylePref[] = ["system", "lexend", "atkinson"];

  // ✅ Apply on mount (in case user opened Settings directly)
  useEffect(() => {
    applySettingsToDocument(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply + store locally whenever settings change
  useEffect(() => {
    applySettingsToDocument(settings);
    saveSettingsToStorage(settings);
  }, [settings]);

  // Store optional toggles locally
  useEffect(() => {
    try {
      localStorage.setItem(
        "waypoint_ui_prefs_v1",
        JSON.stringify({ supportiveReminders, alwaysShowCrisisLink })
      );
    } catch {}
  }, [supportiveReminders, alwaysShowCrisisLink]);

  async function saveToSupabase() {
    setStatus("saving");
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setStatus("error");
        return;
      }

      const { error } = await supabase.from("user_settings").upsert({
        user_id: userData.user.id,
        theme: settings.theme,
        tone: settings.tone,
        font_size: settings.font_size,
        font_style: settings.font_style,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("error");
    }
  }

  function pill(active: boolean) {
    return (
      "rounded-lg border px-3 py-1 text-sm transition " +
      (active
        ? "border-green-300 text-green-900 bg-green-100 dark:border-green-700 dark:text-green-100 dark:bg-green-900/30"
        : "border-foreground/15 text-foreground/80 bg-background hover:bg-foreground/5")
    );
  }

  function togglePill(active: boolean) {
    return (
      "h-5 w-10 rounded-full transition " +
      (active ? "bg-green-600" : "bg-green-300 dark:bg-green-700/60")
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <Header />
        <div className="mt-4">
          <Nav current="settings" />
        </div>

        <div className="mt-4">
          <Card>
            <div className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="mt-1 text-sm opacity-80">
                Your preferences are applied instantly. Save to sync across devices.
              </p>

              {/* Optional toggle (local-only) */}
              <button
                type="button"
                onClick={() => setSupportiveReminders((v: boolean) => !v)}
                className="mt-5 w-full rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-left hover:bg-foreground/10 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Supportive reminders</div>
                    <div className="text-sm opacity-80">
                      Show gentle reminders during chat
                    </div>
                  </div>
                  <div className={togglePill(supportiveReminders)} />
                </div>
              </button>

              {/* Optional toggle (local-only) */}
              <button
                type="button"
                onClick={() => setAlwaysShowCrisisLink((v: boolean) => !v)}
                className="mt-3 w-full rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-left hover:bg-foreground/10 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Crisis resources link</div>
                    <div className="text-sm opacity-80">
                      Always show emergency resources
                    </div>
                  </div>
                  <div className={togglePill(alwaysShowCrisisLink)} />
                </div>
              </button>

              {/* Theme */}
              <div className="mt-6">
                <div className="font-medium">Theme</div>
                <div className="text-sm opacity-80">
                  Light, dark, or match your device
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {themeOptions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, theme: v }))}
                      className={pill(settings.theme === v)}
                    >
                      {v[0].toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div className="mt-6">
                <div className="font-medium">Tone</div>
                <div className="text-sm opacity-80">Preferred response tone</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {toneOptions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, tone: v }))}
                      className={pill(settings.tone === v)}
                    >
                      {v === "gentle" ? "Gentle" : v === "calm" ? "Neutral" : "Direct"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div className="mt-6">
                <div className="font-medium">Font size</div>
                <div className="text-sm opacity-80">
                  Adjust text size for comfortable reading
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizeOptions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, font_size: v }))}
                      className={pill(settings.font_size === v)}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font style */}
              <div className="mt-6">
                <div className="font-medium">Font style</div>
                <div className="text-sm opacity-80">
                  Reading-friendly fonts for accessibility
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fontOptions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, font_style: v }))}
                      className={pill(settings.font_style === v)}
                    >
                      {v === "system" ? "System" : v === "lexend" ? "Lexend" : "Atkinson"}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm opacity-80">
                Preview: This page updates instantly based on your choices.
              </p>

              {/* Save button */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveToSupabase}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {status === "saving" ? "Saving…" : "Save changes"}
                </button>

                {status === "saved" && (
                  <span className="text-sm text-green-700 dark:text-green-200">
                    Saved!
                  </span>
                )}

                {status === "error" && (
                  <span className="text-sm text-red-600">
                    Couldn’t save. Are you logged in?
                  </span>
                )}
              </div>

              <div className="mt-6">
                <DisclaimerBox>
                  Important: Waypoint is not a medical service. It does not diagnose
                  or prescribe.
                </DisclaimerBox>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Footer />
        </div>
      </div>
    </div>
  );
}