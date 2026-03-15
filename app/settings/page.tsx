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

  function pill(active: boolean) {
    return (
      "rounded-xl border px-3 py-2 text-sm transition " +
      (active
        ? "border-green-300 text-green-900 bg-green-100 dark:border-green-700 dark:text-green-100 dark:bg-green-900/30"
        : "border-foreground/15 text-foreground/80 bg-background hover:bg-foreground/5")
    );
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <Header
          title="Settings"
          subtitle="Preview changes here before saving."
        />

        <div className="mt-4">
          <Nav current="settings" />
        </div>

        <div className="mt-6 grid gap-6">
          <Card>
            <div className="rounded-3xl border border-foreground/10 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">Appearance</h2>
                <p className="text-sm text-foreground/70">
                  Changes preview instantly on this page. They only become saved
                  when you press <span className="font-medium">Save changes</span>.
                </p>
              </div>

              <div className="mt-6 space-y-6">
                <section>
                  <h3 className="font-medium">Theme</h3>
                  <p className="mb-3 text-sm text-foreground/70">
                    Light, dark gray, or match your device.
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                  <h3 className="font-medium">Tone</h3>
                  <p className="mb-3 text-sm text-foreground/70">
                    Preferred response style.
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                          ? "Neutral"
                          : "Direct"}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="font-medium">Font size</h3>
                  <p className="mb-3 text-sm text-foreground/70">
                    Adjust text size for comfortable reading.
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                  <h3 className="font-medium">Font style</h3>
                  <p className="mb-3 text-sm text-foreground/70">
                    Reading-friendly fonts with clearer visual differences.
                  </p>
                  <div className="flex flex-wrap gap-2">
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
              </div>
            </div>
          </Card>

          <Card>
            <div className="rounded-3xl border border-foreground/10 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Chat experience</h2>
              <p className="mt-1 text-sm text-foreground/70">
                These options affect behavior in chat and thread browsing.
              </p>

              <div className="mt-5 space-y-3">
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
            </div>
          </Card>

          <Card>
            <div className="rounded-3xl border border-foreground/10 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Save your changes</h2>
                  <p className="text-sm text-foreground/70">
                    Leaving without saving restores your last saved settings.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={saveAll}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    {status === "saving" ? "Saving…" : "Save changes"}
                  </button>

                  {isDirty ? (
                    <button
                      type="button"
                      onClick={revertDraftToSaved}
                      className="rounded-xl border border-foreground/15 px-4 py-2 text-sm transition hover:bg-foreground/5"
                    >
                      Discard changes
                    </button>
                  ) : null}

                  {status === "saved" ? (
                    <span className="text-sm text-green-600 dark:text-green-300">
                      Saved!
                    </span>
                  ) : null}

                  {status === "error" ? (
                    <span className="text-sm text-red-600 dark:text-red-300">
                      Couldn’t save your settings.
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>

          <DisclaimerBox>
            <div className="rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-200/15 dark:bg-amber-300/10 dark:text-amber-100">
              Important: Waypoint is not a medical service. It does not diagnose
              or prescribe.
            </div>
          </DisclaimerBox>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => handleAttemptNavigate("/chat")}
            className="rounded-xl border border-foreground/15 px-4 py-2 text-sm transition hover:bg-foreground/5"
          >
            Back to chat
          </button>
        </div>

        <div className="mt-auto pt-8">
          <Footer />
        </div>
      </main>

      <ConfirmModal
        open={showUnsavedConfirm}
        title="Leave without saving?"
        description="Your previewed changes will be discarded and your last saved settings will be restored."
        confirmLabel="Leave page"
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