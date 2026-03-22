"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";
import { createClient } from "@/lib/supabase/browser";
import PageEnter from "@/components/PageEnter";

type Phase = "loading" | "ready" | "done" | "error";

function parseHashTokens(hash: string) {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(clean);

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const type = params.get("type");
  const error_description = params.get("error_description");
  const error = params.get("error");

  return {
    access_token,
    refresh_token,
    type,
    error,
    error_description,
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setError(null);

        const { data: existing } = await supabase.auth.getSession();
        if (existing.session) {
          if (!cancelled) setPhase("ready");
          return;
        }

        const { access_token, refresh_token, type, error, error_description } =
          parseHashTokens(window.location.hash);

        if (error) {
          if (!cancelled) {
            setError(decodeURIComponent(error_description || error));
            setPhase("error");
          }
          return;
        }

        if (type !== "recovery" || !access_token || !refresh_token) {
          if (!cancelled) {
            setError(
              "This reset link is missing or expired.\nPlease request a new password reset email."
            );
            setPhase("error");
          }
          return;
        }

        const { error: setErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (setErr) {
          if (!cancelled) {
            setError(setErr.message);
            setPhase("error");
          }
          return;
        }

        window.history.replaceState({}, document.title, window.location.pathname);

        if (!cancelled) setPhase("ready");
      } catch {
        if (!cancelled) {
          setError("Something went wrong opening this reset link.");
          setPhase("error");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const p = password.trim();
    const c = confirm.trim();

    if (p.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (p !== c) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: p,
      });

      if (updateErr) {
        setError(updateErr.message);
        setSaving(false);
        return;
      }

      setPhase("done");
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch {
      setError("Couldn’t update password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_24%),var(--background)] px-4 pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-24 h-56 w-56 rounded-full bg-emerald-400/14 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute right-[-4rem] top-36 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-400/10" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-teal-300/12 blur-3xl dark:bg-teal-400/8" />
      </div>
      <PageEnter>
      <div className="relative mx-auto max-w-3xl pt-8">
        <Header
          title="Reset password"
          subtitle="Choose a new password to continue back into your account."
        />

        <div className="mt-8">
          <Card className="relative overflow-hidden border-emerald-100/90 bg-white/88 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#272c34]/94 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

            <div className="relative p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  New password
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                  Verified reset
                </span>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Update password
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground/68">
                  Choose a new password to finish recovery and continue back to
                  login.
                </p>
              </div>

              {phase === "loading" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                  Opening your reset link…
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm whitespace-pre-wrap text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </div>
              )}

              {phase === "done" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Password updated! Redirecting to login…
                </div>
              )}

              {phase === "ready" && (
                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">
                      New password
                    </label>
                    <TextInput
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">
                      Confirm new password
                    </label>
                    <TextInput
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-type your password"
                      className="w-full"
                    />
                  </div>

                  <PrimaryButton
                    type="submit"
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? "Saving…" : "Update password"}
                  </PrimaryButton>

                  <div className="flex justify-end text-sm">
                    <Link
                      href="/login"
                      className="font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                    >
                      Back to login
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>

        <Footer />
      </div>
      </PageEnter>
    </main>
  );
}