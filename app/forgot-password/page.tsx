"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";
import { createClient } from "@/lib/supabase/browser";
import PageEnter from "@/components/PageEnter";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function sendReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    setStatus("sending");

    try {
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
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
          title="Forgot password"
          subtitle="Enter your email and we’ll send you a reset link."
        />

        <div className="mt-8">
          <Card className="relative overflow-hidden border-emerald-100/90 bg-white/88 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#272c34]/94 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

            <div className="relative p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Password reset
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                  Secure access
                </span>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Send reset link
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground/68">
                  We’ll email you a link to reset your password and continue
                  where you left off.
                </p>
              </div>

              <form onSubmit={sendReset} className="space-y-5">
                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </div>
                ) : null}

                {status === "sent" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Sent! Check your inbox and spam folder for the reset link.
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">
                    Email
                  </label>
                  <TextInput
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full"
                  />
                </div>

                <PrimaryButton
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full"
                >
                  {status === "sending" ? "Sending..." : "Send reset link"}
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
            </div>
          </Card>
        </div>

        <Footer />
      </div>
      </PageEnter>
    </main>
  );
}