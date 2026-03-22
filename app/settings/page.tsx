"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import Card from "@/components/Card";
import Header from "@/components/Header";
import ConfirmModal from "@/components/ConfirmModal";
import ToggleSwitch from "@/components/ToggleSwitch";
import { createClient } from "@/lib/supabase/browser";
import PageEnter from "@/components/PageEnter";
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
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

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
    const localSettings = loadSettingsFromStorage();
    const localUiPrefs = loadUiPrefs();

    setSavedSettings(localSettings);
    setDraftSettings(localSettings);
    setSavedUiPrefs(localUiPrefs);
    setDraftUiPrefs(localUiPrefs);

    applySettingsToDocument(localSettings);
    applyUiPrefsToDocument(localUiPrefs);
    setHasLoadedInitialData(true);
  }, []);

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

    if (hasLoadedInitialData) {
      loadFromSupabase();
    }
  }, [hasLoadedInitialData]);

  useEffect(() => {
    if (!hasLoadedInitialData) return;
    applySettingsToDocument(draftSettings);
  }, [draftSettings, hasLoadedInitialData]);

  useEffect(() => {
    if (!hasLoadedInitialData) return;
    applyUiPrefsToDocument(draftUiPrefs);
  }, [draftUiPrefs, hasLoadedInitialData]);

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
      return "You’re doing okay.\nWe can take this one small step at a time.";
    }

    if (draftSettings.tone === "direct") {
      return "Let’s keep it simple. Tell me what happened, and we’ll sort it out.";
    }

    return "I’m here with you.\nTell me what’s going on, and we’ll work through it together.";
  }, [draftSettings.tone]);

  function pill(active: boolean) {
    return [
      "rounded-full border px-3.5 py-2 text-sm font-medium transition",
      active
        ? "border-emerald-300 bg-emerald-100 text-emerald-950 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/14 dark:text-emerald-100"
        : "border-foreground/10 bg-background text-foreground/80 hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6",
    ].join(" ");
  }

  function sectionCard(
    title: string,
    description: string,
    content: React.ReactNode,
    badge?: string
  ) {
    return (
      <Card className="relative overflow-hidden border-emerald-100/90 bg-white/88 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#272c34]/94 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />
        <div className="p-6 sm:p-8">
          {badge ? (
            <div className="mb-4">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                {badge}
              </span>
            </div>
          ) : null}

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/68">{description}</p>

          <div className="mt-6">{content}</div>
        </div>
      </Card>
    );
  }

  if (!hasLoadedInitialData) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_24%),var(--background)] px-4 pb-10">
        <Nav current="settings" />
        <div className="relative mx-auto mt-6 max-w-4xl">
          <Header title="Settings" subtitle="Adjust the experience so it feels right for you." />
          <div className="mt-8">
            <Card className="border-emerald-100/90 bg-white/88 p-6 text-sm shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#272c34]/94 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              Loading your settings…
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_24%),var(--background)] px-4 pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-24 h-56 w-56 rounded-full bg-emerald-400/12 blur-3xl dark:bg-emerald-400/8" />
        <div className="absolute right-[-4rem] top-32 h-72 w-72 rounded-full bg-sky-300/16 blur-3xl dark:bg-sky-400/8" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl dark:bg-teal-400/6" />
      </div>

      <Nav current="settings" />
      <PageEnter>
      <div className="relative mx-auto mt-6 max-w-5xl">
        <Header
          title="Settings"
          subtitle="Adjust the experience so it feels calmer, clearer, and more comfortable for you."
        />

        <div className="mt-6 grid gap-6">
          {sectionCard(
            "Appearance",
            "Changes preview instantly on this page. They are only saved when you press Save changes.",
            <div className="space-y-6">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Theme
                </div>
                <p className="mb-3 text-sm text-foreground/62">
                  Light, dark gray, or match your device.
                </p>
                <div className="flex flex-wrap gap-2">
                  {themeOptions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDraftSettings((s) => ({ ...s, theme: v }))}
                      className={pill(draftSettings.theme === v)}
                    >
                      {v[0].toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Tone
                </div>
                <p className="mb-3 text-sm text-foreground/62">
                  Preferred response style.
                </p>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDraftSettings((s) => ({ ...s, tone: v }))}
                      className={pill(draftSettings.tone === v)}
                    >
                      {v === "gentle" ? "Gentle" : v === "calm" ? "Calm" : "Direct"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Font size
                </div>
                <p className="mb-3 text-sm text-foreground/62">
                  Adjust text size for comfortable reading.
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDraftSettings((s) => ({ ...s, font_size: v }))}
                      className={pill(draftSettings.font_size === v)}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Font style
                </div>
                <p className="mb-3 text-sm text-foreground/62">
                  Reading-friendly fonts with clearer visual differences.
                </p>
                <div className="flex flex-wrap gap-2">
                  {fontOptions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDraftSettings((s) => ({ ...s, font_style: v }))}
                      className={pill(draftSettings.font_style === v)}
                    >
                      {v === "system" ? "System" : v === "lexend" ? "Lexend" : "Atkinson"}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            "Appearance"
          )}

          {sectionCard(
            "Chat experience",
            "These options affect behavior in chat and thread browsing.",
            <div className="space-y-4">
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
            </div>,
            "Chat preferences"
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {sectionCard(
              "Live preview",
              "This updates instantly based on your draft settings.",
              <div className="rounded-[1.75rem] border border-black/6 bg-white/72 p-4 shadow-sm dark:border-white/8 dark:bg-[#222831]/60">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Waypoint preview
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-3xl border border-black/6 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm dark:border-white/8 dark:bg-[#313743] dark:text-slate-100">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
                        Waypoint
                      </div>
                      <div className="whitespace-pre-wrap">{previewTone}</div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[88%] rounded-3xl bg-emerald-100 px-4 py-3 text-sm leading-6 text-emerald-950 shadow-sm dark:bg-emerald-500/16 dark:text-emerald-100">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/50">
                        You
                      </div>
                      I’ve had a lot on my mind lately.
                    </div>
                  </div>
                </div>
              </div>,
              "Preview"
            )}

            {sectionCard(
              "Save your changes",
              "Leaving without saving restores your last saved settings.",
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={saveAll}
                  disabled={status === "saving"}
                  className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "saving" ? "Saving…" : "Save changes"}
                </button>

                {isDirty ? (
                  <button
                    type="button"
                    onClick={revertDraftToSaved}
                    className="flex w-full items-center justify-center rounded-2xl border border-foreground/10 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
                  >
                    Discard changes
                  </button>
                ) : null}

                {status === "saved" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Saved!
                  </div>
                ) : null}

                {status === "error" ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                    Couldn’t save your settings.
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleAttemptNavigate("/chat")}
                  className="mt-2 flex w-full items-center justify-center rounded-2xl border border-foreground/10 px-5 py-3 text-sm font-medium transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
                >
                  Back to chat
                </button>
              </div>,
              "Save"
            )}
          </div>
        </div>

        <Footer />
      </div>
      </PageEnter>

      <ConfirmModal
        open={showUnsavedConfirm}
        title="Discard unsaved changes?"
        description="You have changes that are not saved yet. If you leave now, your draft settings will be reset to the last saved version."
        confirmLabel="Discard and leave"
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
    </main>
  );
}