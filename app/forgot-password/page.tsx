"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import DisclaimerBox from "@/components/DisclaimerBox";
import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";
import { createClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function sendReset(e: React.FormEvent) {
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

      // Sends a reset link to the email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail, {
  redirectTo: `${window.location.origin}/reset-password`,
});

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full">
          <Header />

          <div className="mt-6">
            <Card>
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold">Forgot password</h2>
                <p className="mt-1 text-sm opacity-80">
                  Enter your email and we’ll send you a reset link.
                </p>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-300 bg-red-50/60 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                  </div>
                )}

                {status === "sent" && (
                  <div className="mt-4 rounded-xl border border-green-300 bg-green-50/60 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                    Sent! Check your inbox (and spam folder) for the reset link.
                  </div>
                )}

                <form onSubmit={sendReset} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
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
                    className="w-full"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? "Sending…" : "Send reset link"}
                  </PrimaryButton>
                </form>

                <div className="mt-4 text-center text-sm">
                  <Link
                    href="/login"
                    className="text-green-700 hover:text-green-900 hover:underline dark:text-green-200"
                  >
                    Back to login
                  </Link>
                </div>

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