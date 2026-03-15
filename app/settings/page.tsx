"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import Card from "@/components/Card";
import Header from "@/components/Header";
import DisclaimerBox from "@/components/DisclaimerBox";
import ConfirmModal from "@/components/ConfirmModal";
import ToggleSwitch from "@/components/ToggleSwitch";
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
import {
  DEFAULT_UI_PREFS,
  applyUiPrefsToDocument,
  loadUiPrefs,
  saveUiPrefs,
  type UiPrefs,
} from "./uiPrefs";

type Status = "idle" | "saving" | "saved" | "error";

export default function SettingsPage() {
  const router = useRouter();

  const [savedSettings, setSavedSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [draftSettings, setDraftSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedUiPrefs, setSavedUiPrefs] = useState<UiPrefs>(DEFAULT_UI_PREFS);
  const [draftUiPrefs, setDraftUiPrefs] = useState<UiPrefs>(DEFAULT_UI_PREFS);
  const [status, setStatus] = useState<Status>("idle");
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  const themeOptions: ThemePref[] = ["system", "light", "dark"];
  const toneOptions: TonePref[] = ["gentle", "calm", "direct"];
  const sizeOptions: FontSizePref[] = ["sm", "md", "lg", "xl"];
  const fontOptions: FontStylePref[] = ["system", "lexend", "atkinson"];

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(savedSettings) !== JSON.stringify(draftSettings) ||
      JSON.stringify(savedUiPrefs) !== JSON.stringify(draftUiPrefs)
    );
  }, [savedSettings, draftSettings, savedUiPrefs, draftUiPrefs]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const localSettings = loadSettingsFromStorage();
    const localUiPrefs = loadUiPrefs();

    setSavedSettings(localSettings);
    setDraftSettings(localSettings);
    setSavedUiPrefs(localUiPrefs);
    setDraftUiPrefs(localUiPrefs);

    applySettingsToDocument(localSettings);
    applyUiPrefsToDocument(localUiPrefs);
  }, [hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;

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

        const uiFromDb: UiPrefs = {
          ...loadUiPrefs(),
          supportiveReminders: data.supportive_reminders ?? true,
          alwaysShowCrisisLink: data.always_show_crisis_link ?? true,
        };

        setSavedSettings(fromDb);
        setDraftSettings(fromDb);
        setSavedUiPrefs(uiFromDb);
        setDraftUiPrefs(uiFromDb);

        saveSettingsToStorage(fromDb);
        saveUiPrefs(uiFromDb);
        applySettingsToDocument(fromDb);
        applyUiPrefsToDocument(uiFromDb);
      } catch {}
    }

    loadFromSupabase();
  }, [hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    applySettingsToDocument(draftSettings);
  }, [draftSettings, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    applyUiPrefsToDocument(draftUiPrefs);
  }, [draftUiPrefs, hasMounted]);

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
    setDraftUiPrefs(savedUiPrefs);
    applySettingsToDocument(savedSettings);
    applyUiPrefsToDocument(savedUiPrefs);
    setStatus("idle");
  }

  function handleAttemptNavigate(path: string) {
    if (!isDirty) {
      router.push(path);
      return;
    }

    setPendingPath(path);
    setShowUnsavedConfirm(true);
  }

  async function saveAll() {
    setStatus("saving");

    try {
      saveSettingsToStorage(draftSettings);
      saveUiPrefs(draftUiPrefs);
      setSavedSettings(draftSettings);
      setSavedUiPrefs(draftUiPrefs);

      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (userData.user) {
        const payload = {
          user_id: userData.user.id,
          theme: draftSettings.theme,
          tone: draftSettings.tone,
          font_size: draftSettings.font_size,
          font_style: draftSettings.font_style,
          supportive_reminders: draftUiPrefs.supportiveReminders,
          always_show_crisis_link: draftUiPrefs.alwaysShowCrisisLink,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("user_settings").upsert(payload);
        if (error) throw error;
      }

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("error");
    }
  }

  const previewTone = useMemo(() => {
    if (draftSettings.tone === "gentle") {
      return "You’re doing okay. We can take this one small step at a time.";
    }
    if (draftSettings.tone === "direct") {
      return "Let’s keep it simple. Tell me what happened, and we’ll sort it out.";
    }
    return "I’m here with you. Tell me what’s going on, and we’ll work through it together.";
  }, [draftSettings.tone]);

  function pill(active: boolean) {
    return [
      "rounded-full border px-3.5 py-2 text-sm font-medium transition",
      active
        ? "border-emerald-300 bg-emerald-100 text-emerald-950 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/14 dark:text-emerald-100"
        : "border-foreground/10 bg-background text-foreground/80 hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6",
    ].join(" ");
  }

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_32%),var(--background)] px-4 pb-10">
        <Nav current="settings" />

        <div className="mx-auto mt-6 max-w-6xl">
          <Header
            title="Settings"
            subtitle="Comfort-first preferences for your Waypoint space"
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Appearance
                  </h2>
                  <p className="mt-1 text-sm text-foreground/70">
                    Changes preview instantly on this page. They only become saved
                    when you press Save changes.
                  </p>
                </div>

                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/55">
                      Theme
                    </h3>
                    <p className="mt-1 text-sm text-foreground/70">
                      Light, dark gray, or match your device.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {themeOptions.map((v) => (
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
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/55">
                      Tone
                    </h3>
                    <p className="mt-1 text-sm text-foreground/70">
                      Preferred response style.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {toneOptions.map((v) => (
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
                            ? "Calm"
                            : "Direct"}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/55">
                      Font size
                    </h3>
                    <p className="mt-1 text-sm text-foreground/70">
                      Adjust text size for comfortable reading.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sizeOptions.map((v) => (
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
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/55">
                      Font style
                    </h3>
                    <p className="mt-1 text-sm text-foreground/70">
                      Reading-friendly fonts with clearer visual differences.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {fontOptions.map((v) => (
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
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/55">
                      Chat experience
                    </h3>
                    <p className="mt-1 text-sm text-foreground/70">
                      These options affect behavior in chat and thread browsing.
                    </p>

                    <div className="mt-3 space-y-3">
                      <ToggleSwitch
                        checked={draftUiPrefs.supportiveReminders}
                        onChange={() =>
                          setDraftUiPrefs((v) => ({
                            ...v,
                            supportiveReminders: !v.supportiveReminders,
                          }))
                        }
                        label="Supportive reminders"
                        description="Let Waypoint add gentle coping reminders like breathing, grounding, pausing, or taking one small next step."
                      />

                      <ToggleSwitch
                        checked={draftUiPrefs.alwaysShowCrisisLink}
                        onChange={() =>
                          setDraftUiPrefs((v) => ({
                            ...v,
                            alwaysShowCrisisLink: !v.alwaysShowCrisisLink,
                          }))
                        }
                        label="Crisis resources link"
                        description="Include Philippines emergency and crisis hotline guidance more consistently in emotional safety responses."
                      />

                      <ToggleSwitch
                        checked={draftUiPrefs.enterToSend}
                        onChange={() =>
                          setDraftUiPrefs((v) => ({
                            ...v,
                            enterToSend: !v.enterToSend,
                          }))
                        }
                        label="Enter to send"
                        description="Press Enter to send. Use Shift + Enter for a new line."
                      />

                      <ToggleSwitch
                        checked={draftUiPrefs.showTimestamps}
                        onChange={() =>
                          setDraftUiPrefs((v) => ({
                            ...v,
                            showTimestamps: !v.showTimestamps,
                          }))
                        }
                        label="Show timestamps"
                        description="Display date and time stamps in your conversations."
                      />

                      <ToggleSwitch
                        checked={draftUiPrefs.compactThreads}
                        onChange={() =>
                          setDraftUiPrefs((v) => ({
                            ...v,
                            compactThreads: !v.compactThreads,
                          }))
                        }
                        label="Compact thread list"
                        description="Use a tighter layout for the thread sidebar."
                      />

                      <ToggleSwitch
                        checked={draftUiPrefs.reduceMotion}
                        onChange={() =>
                          setDraftUiPrefs((v) => ({
                            ...v,
                            reduceMotion: !v.reduceMotion,
                          }))
                        }
                        label="Reduce motion"
                        description="Limit animations and transitions for a calmer interface."
                      />
                    </div>
                  </section>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold">Live preview</h2>
                <p className="mt-1 text-sm text-foreground/70">
                  This updates instantly based on your draft settings.
                </p>

                <div className="mt-4 rounded-3xl border border-black/6 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm dark:border-white/8 dark:from-[#2b313a] dark:to-[#262b33]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
                    Waypoint preview
                  </div>

                  <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-800 shadow-sm dark:bg-[#313743] dark:text-slate-100">
                    {previewTone}
                  </div>

                  <div className="mt-3 rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-950 shadow-sm dark:bg-emerald-500/16 dark:text-emerald-100">
                    I’ve had a lot on my mind lately.
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold">Save your changes</h2>
                <p className="mt-1 text-sm text-foreground/70">
                  Leaving without saving restores your last saved settings.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={saveAll}
                    className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    {status === "saving" ? "Saving…" : "Save changes"}
                  </button>

                  {isDirty ? (
                    <button
                      type="button"
                      onClick={revertDraftToSaved}
                      className="rounded-full border border-foreground/10 px-4 py-2 text-sm font-medium transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
                    >
                      Discard changes
                    </button>
                  ) : null}

                  {status === "saved" ? (
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Saved!
                    </span>
                  ) : null}

                  {status === "error" ? (
                    <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
                      Couldn’t save your settings.
                    </span>
                  ) : null}
                </div>

                <div className="mt-5">
                  <DisclaimerBox>
                    <strong>Important:</strong> Waypoint is not a medical service.
                    It does not diagnose or prescribe. If you are in immediate
                    danger, contact local emergency services or a trusted person
                    right away.
                  </DisclaimerBox>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handleAttemptNavigate("/chat")}
                    className="rounded-full border border-foreground/10 px-4 py-2 text-sm font-medium transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
                  >
                    Back to chat
                  </button>
                </div>
              </Card>
            </div>
          </div>

          <Footer />
        </div>
      </main>

      <ConfirmModal
        open={showUnsavedConfirm}
        title="Leave this page without saving?"
        description="Your unsaved changes will be discarded."
        confirmLabel="Discard changes"
        cancelLabel="Stay here"
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