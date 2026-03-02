"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import DisclaimerBox from "@/components/DisclaimerBox";
import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";
import { createClient } from "@/lib/supabase/browser";

type Phase = "loading" | "ready" | "done" | "error";

function parseHashTokens(hash: string) {
  // Supabase recovery links usually put tokens in the URL hash:
  // #access_token=...&refresh_token=...&type=recovery
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

  // 1) On load, turn the recovery tokens in the URL into a Supabase session
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setError(null);

        // If Supabase already picked up a session, we’re good
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session) {
          if (!cancelled) setPhase("ready");
          return;
        }

        // Otherwise, parse tokens from hash (most common recovery flow)
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
              "This reset link is missing or expired. Please request a new password reset email."
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

        // Optional: clean the hash so refreshing the page is less confusing
        // (doesn’t affect the session once it's set)
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

      // Optional: sign out after changing password (cleaner flow)
      await supabase.auth.signOut();

      // Redirect to login after a short moment
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full">
          <Header />

          <div className="mt-6">
            <Card>
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold">Reset password</h2>
                <p className="mt-1 text-sm opacity-80">
                  Choose a new password for your account.
                </p>

                {phase === "loading" && (
                  <div className="mt-4 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm">
                    Opening your reset link…
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-xl border border-red-300 bg-red-50/60 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                  </div>
                )}

                {phase === "done" && (
                  <div className="mt-4 rounded-xl border border-green-300 bg-green-50/60 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                    Password updated! Redirecting to login…
                  </div>
                )}

                {phase === "ready" && (
                  <form onSubmit={handleSave} className="mt-5 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        New password
                      </label>
                      <TextInput
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Confirm new password
                      </label>
                      <TextInput
                        name="confirmPassword"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-type your password"
                        className="w-full"
                      />
                    </div>

                    <PrimaryButton
                      type="submit"
                      className="w-full"
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Update password"}
                    </PrimaryButton>

                    <div className="text-center text-sm">
                      <Link
                        href="/login"
                        className="text-green-700 hover:text-green-900 hover:underline dark:text-green-200"
                      >
                        Back to login
                      </Link>
                    </div>
                  </form>
                )}

                <div className="mt-6">
                  <DisclaimerBox>
                    <span className="font-semibold">Important:</span> Waypoint is
                    not a medical service. It does not diagnose or prescribe.
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
    </div>
  );
}