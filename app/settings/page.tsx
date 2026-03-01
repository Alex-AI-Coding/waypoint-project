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
  type UserSettings,
  type ThemePref,
  type TonePref,
  type FontSizePref,
  type FontStylePref,
} from "./settingsClient";

type Status = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Optional toggles (keep your UI but make it real in localStorage)
  const [supportiveReminders, setSupportiveReminders] = useState(true);
  const [alwaysShowCrisisLink, setAlwaysShowCrisisLink] = useState(true);

  const [status, setStatus] = useState<Status>("idle");

  const themeOptions: ThemePref[] = ["system", "light", "dark"];
  const toneOptions: TonePref[] = ["gentle", "calm", "direct"];
  const sizeOptions: FontSizePref[] = ["sm", "md", "lg", "xl"];
  const fontOptions: FontStylePref[] = ["system", "lexend", "atkinson"];

  // Load settings on mount
  useEffect(() => {
    const s = loadSettingsFromStorage();
    setSettings(s);
    applySettingsToDocument(s);

    // Load your optional toggles (local-only)
    try {
      const raw = localStorage.getItem("waypoint_ui_prefs_v1");
      if (raw) {
        const p = JSON.parse(raw);
        setSupportiveReminders(p.supportiveReminders ?? true);
        setAlwaysShowCrisisLink(p.alwaysShowCrisisLink ?? true);
      }
    } catch {}
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
        ? "border-green-300 text-green-900 bg-green-100"
        : "border-green-200 text-green-700 bg-white hover:bg-green-50")
    );
  }

  function togglePill(active: boolean) {
    return (
      "h-5 w-10 rounded-full transition " +
      (active ? "bg-green-600" : "bg-green-300")
    );
  }

  return (
    <main className="min-h-screen bg-green-50 dark:bg-zinc-950 p-6 flex justify-center">
      <div className="w-full max-w-3xl">
        <Card>
          <Nav current="settings" />
          <div className="h-3" />

          <Header title="Settings" subtitle="" rightLinkHref="/" rightLinkLabel="Home" />

          <div className="space-y-6">
            {/* Optional toggle (now real, local-only) */}
            <button
              type="button"
              onClick={() => setSupportiveReminders((v) => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-zinc-100">
                  Supportive reminders
                </p>
                <p className="text-xs text-green-700 dark:text-zinc-300">
                  Show gentle reminders during chat
                </p>
              </div>
              <div className={togglePill(supportiveReminders)} />
            </button>

            {/* Optional toggle (now real, local-only) */}
            <button
              type="button"
              onClick={() => setAlwaysShowCrisisLink((v) => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-zinc-100">
                  Crisis resources link
                </p>
                <p className="text-xs text-green-700 dark:text-zinc-300">
                  Always show emergency resources
                </p>
              </div>
              <div className={togglePill(alwaysShowCrisisLink)} />
            </button>

            {/* Theme */}
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-zinc-100">
                Theme
              </p>
              <p className="text-xs text-green-700 dark:text-zinc-300 mb-2">
                Light, dark, or match your device
              </p>

              <div className="flex gap-2 flex-wrap">
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
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-zinc-100">
                Tone
              </p>
              <p className="text-xs text-green-700 dark:text-zinc-300 mb-2">
                Preferred response tone
              </p>

              <div className="flex gap-2 flex-wrap">
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
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-zinc-100">
                Font size
              </p>
              <p className="text-xs text-green-700 dark:text-zinc-300 mb-2">
                Adjust text size for comfortable reading
              </p>

              <div className="flex gap-2 flex-wrap">
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
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-zinc-100">
                Font style
              </p>
              <p className="text-xs text-green-700 dark:text-zinc-300 mb-2">
                Reading-friendly fonts for accessibility
              </p>

              <div className="flex gap-2 flex-wrap">
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

              <p className="mt-2 text-xs text-green-700 dark:text-zinc-300">
                Preview: This page updates instantly based on your choices.
              </p>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveToSupabase}
                disabled={status === "saving"}
                className="rounded-xl bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-600 transition disabled:opacity-60"
              >
                {status === "saving" ? "Saving…" : "Save changes"}
              </button>

              {status === "saved" && (
                <span className="text-sm text-green-700 dark:text-green-400">
                  Saved!
                </span>
              )}

              {status === "error" && (
                <span className="text-sm text-red-600">
                  Couldn’t save. Are you logged in?
                </span>
              )}
            </div>

            <DisclaimerBox>
              <strong>Important:</strong> Waypoint is not a medical service. It does not diagnose or prescribe.
            </DisclaimerBox>
          </div>
        </Card>

        <Footer />
      </div>
    </main>
  );
}