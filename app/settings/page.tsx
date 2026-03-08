"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import Card from "@/components/Card";
import Header from "@/components/Header";
import DisclaimerBox from "@/components/DisclaimerBox";
import ConfirmModal from "@/components/ConfirmModal";
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
  type UserSettings,
} from "./settingsClient";

type Status = "idle" | "saving" | "saved" | "error";

const UI_PREFS_KEY = "waypoint_ui_prefs_v1";

function loadUiPrefs() {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) {
      return {
        supportiveReminders: true,
        alwaysShowCrisisLink: true,
      };
    }

    const parsed = JSON.parse(raw);
    return {
      supportiveReminders: parsed.supportiveReminders ?? true,
      alwaysShowCrisisLink: parsed.alwaysShowCrisisLink ?? true,
    };
  } catch {
    return {
      supportiveReminders: true,
      alwaysShowCrisisLink: true,
    };
  }
}

export default function SettingsPage() {
  const router = useRouter();

  const initialSettings =
    typeof window === "undefined"
      ? DEFAULT_SETTINGS
      : loadSettingsFromStorage();

  const initialUiPrefs =
    typeof window === "undefined"
      ? { supportiveReminders: true, alwaysShowCrisisLink: true }
      : loadUiPrefs();

  const [savedSettings, setSavedSettings] = useState<UserSettings>(initialSettings);
  const [draftSettings, setDraftSettings] = useState<UserSettings>(initialSettings);

  const [savedSupportiveReminders, setSavedSupportiveReminders] = useState<boolean>(
    initialUiPrefs.supportiveReminders
  );
  const [draftSupportiveReminders, setDraftSupportiveReminders] = useState<boolean>(
    initialUiPrefs.supportiveReminders
  );

  const [savedAlwaysShowCrisisLink, setSavedAlwaysShowCrisisLink] =
    useState<boolean>(initialUiPrefs.alwaysShowCrisisLink);
  const [draftAlwaysShowCrisisLink, setDraftAlwaysShowCrisisLink] =
    useState<boolean>(initialUiPrefs.alwaysShowCrisisLink);

  const [status, setStatus] = useState<Status>("idle");
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const themeOptions: ThemePref[] = ["system", "light", "dark"];
  const toneOptions: TonePref[] = ["gentle", "calm", "direct"];
  const sizeOptions: FontSizePref[] = ["sm", "md", "lg", "xl"];
  const fontOptions: FontStylePref[] = ["system", "lexend", "atkinson"];

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(savedSettings) !== JSON.stringify(draftSettings) ||
      savedSupportiveReminders !== draftSupportiveReminders ||
      savedAlwaysShowCrisisLink !== draftAlwaysShowCrisisLink
    );
  }, [
    savedSettings,
    draftSettings,
    savedSupportiveReminders,
    draftSupportiveReminders,
    savedAlwaysShowCrisisLink,
    draftAlwaysShowCrisisLink,
  ]);

  useEffect(() => {
    applySettingsToDocument(draftSettings);
  }, [draftSettings]);

  useEffect(() => {
    async function loadFromSupabase() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data } = await supabase
          .from("user_settings")
          .select(
            "theme, tone, font_size, font_style, supportive_reminders, always_show_crisis_link"
          )
          .eq("user_id", userData.user.id)
          .single();

        if (!data) return;

        const fromDb: UserSettings = {
          theme:
            data.theme === "light" || data.theme === "dark" || data.theme === "system"
              ? data.theme
              : DEFAULT_SETTINGS.theme,
          tone:
            data.tone === "gentle" || data.tone === "calm" || data.tone === "direct"
              ? data.tone
              : DEFAULT_SETTINGS.tone,
          font_size:
            data.font_size === "sm" ||
            data.font_size === "md" ||
            data.font_size === "lg" ||
            data.font_size === "xl"
              ? data.font_size
              : DEFAULT_SETTINGS.font_size,
          font_style:
            data.font_style === "system" ||
            data.font_style === "lexend" ||
            data.font_style === "atkinson"
              ? data.font_style
              : DEFAULT_SETTINGS.font_style,
        };

        const support = data.supportive_reminders ?? true;
        const crisis = data.always_show_crisis_link ?? true;

        setSavedSettings(fromDb);
        setDraftSettings(fromDb);

        setSavedSupportiveReminders(support);
        setDraftSupportiveReminders(support);

        setSavedAlwaysShowCrisisLink(crisis);
        setDraftAlwaysShowCrisisLink(crisis);

        saveSettingsToStorage(fromDb);
        localStorage.setItem(
          UI_PREFS_KEY,
          JSON.stringify({
            supportiveReminders: support,
            alwaysShowCrisisLink: crisis,
          })
        );
      } catch {}
    }

    loadFromSupabase();
  }, []);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function revertDraftToSaved() {
    setDraftSettings(savedSettings);
    setDraftSupportiveReminders(savedSupportiveReminders);
    setDraftAlwaysShowCrisisLink(savedAlwaysShowCrisisLink);
    applySettingsToDocument(savedSettings);
    setStatus("idle");
  }

  function handleAttemptNavigate(path: string) {
    if (!isDirty) {
      router.push(path);
      return false;
    }

    setPendingPath(path);
    setShowUnsavedConfirm(true);
    return false;
  }

  async function saveToSupabase() {
    setStatus("saving");

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setStatus("error");
        return;
      }

      const payload = {
        user_id: userData.user.id,
        theme: draftSettings.theme,
        tone: draftSettings.tone,
        font_size: draftSettings.font_size,
        font_style: draftSettings.font_style,
        supportive_reminders: draftSupportiveReminders,
        always_show_crisis_link: draftAlwaysShowCrisisLink,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("user_settings").upsert(payload);
      if (error) throw error;

      saveSettingsToStorage(draftSettings);
      localStorage.setItem(
        UI_PREFS_KEY,
        JSON.stringify({
          supportiveReminders: draftSupportiveReminders,
          alwaysShowCrisisLink: draftAlwaysShowCrisisLink,
        })
      );

      setSavedSettings(draftSettings);
      setSavedSupportiveReminders(draftSupportiveReminders);
      setSavedAlwaysShowCrisisLink(draftAlwaysShowCrisisLink);

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
    <>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          <Header />

          <div className="mt-4">
            <Nav current="settings" onNavigate={handleAttemptNavigate} />
          </div>

          <div className="mt-4">
            <Card>
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold">Settings</h2>
                <p className="mt-1 text-sm opacity-80">
                  Changes preview instantly on this page. They only become saved when
                  you press Save changes.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setDraftSupportiveReminders((v: boolean) => !v)
                  }
                  className="mt-5 w-full rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-left hover:bg-foreground/10 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">Supportive reminders</div>
                      <div className="text-sm opacity-80">
                        Let Waypoint add gentle coping reminders like breathing,
                        grounding, pausing, or taking one small next step.
                      </div>
                    </div>
                    <div className={togglePill(draftSupportiveReminders)} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraftAlwaysShowCrisisLink((v: boolean) => !v)
                  }
                  className="mt-3 w-full rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-left hover:bg-foreground/10 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">Crisis resources link</div>
                      <div className="text-sm opacity-80">
                        Include Philippines emergency/crisis hotline guidance in
                        emotional safety responses more consistently.
                      </div>
                    </div>
                    <div className={togglePill(draftAlwaysShowCrisisLink)} />
                  </div>
                </button>

                <div className="mt-6">
                  <div className="font-medium">Theme</div>
                  <div className="text-sm opacity-80">
                    Light, dark, or match your device
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {themeOptions.map((v: ThemePref) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({ ...s, theme: v }))
                        }
                        className={pill(draftSettings.theme === v)}
                      >
                        {v[0].toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="font-medium">Tone</div>
                  <div className="text-sm opacity-80">Preferred response tone</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {toneOptions.map((v: TonePref) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({ ...s, tone: v }))
                        }
                        className={pill(draftSettings.tone === v)}
                      >
                        {v === "gentle"
                          ? "Gentle"
                          : v === "calm"
                          ? "Neutral"
                          : "Direct"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="font-medium">Font size</div>
                  <div className="text-sm opacity-80">
                    Adjust text size for comfortable reading
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sizeOptions.map((v: FontSizePref) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({ ...s, font_size: v }))
                        }
                        className={pill(draftSettings.font_size === v)}
                      >
                        {v.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="font-medium">Font style</div>
                  <div className="text-sm opacity-80">
                    Reading-friendly fonts for accessibility
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fontOptions.map((v: FontStylePref) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setDraftSettings((s) => ({ ...s, font_style: v }))
                        }
                        className={pill(draftSettings.font_style === v)}
                      >
                        {v === "system"
                          ? "System"
                          : v === "lexend"
                          ? "Lexend"
                          : "Atkinson"}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-sm opacity-80">
                  Preview: this page updates instantly based on your draft changes.
                  Leaving without saving will restore your last saved settings.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={saveToSupabase}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200"
                  >
                    {status === "saving" ? "Saving…" : "Save changes"}
                  </button>

                  {isDirty && (
                    <button
                      type="button"
                      onClick={revertDraftToSaved}
                      className="rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-green-200"
                    >
                      Discard changes
                    </button>
                  )}

                  {status === "saved" && (
                    <span className="text-sm text-green-700 dark:text-green-200">
                      Saved!
                    </span>
                  )}

                  {status === "error" && (
                    <span className="text-sm text-red-600">
                      Couldn’t save your settings.
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

      <ConfirmModal
        open={showUnsavedConfirm}
        title="Discard unsaved changes?"
        description="You have unsaved settings changes. Leaving this page will discard them and restore your last saved settings."
        confirmLabel="Discard"
        cancelLabel="Stay"
        onCancel={() => {
          setShowUnsavedConfirm(false);
          setPendingPath(null);
        }}
        onConfirm={() => {
          setShowUnsavedConfirm(false);
          revertDraftToSaved();

          if (pendingPath) {
            router.push(pendingPath);
          }

          setPendingPath(null);
        }}
      />
    </>
  );
}