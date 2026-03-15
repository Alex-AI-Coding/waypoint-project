"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";
import DisclaimerBox from "@/components/DisclaimerBox";
import { createClient } from "@/lib/supabase/browser";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/chat");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground/80">
          Email
        </label>
        <TextInput name="email" type="email" placeholder="you@example.com" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground/80">
          Password
        </label>

        <div className="relative">
          <TextInput
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 my-auto h-8 rounded-lg px-2 text-xs font-medium text-green-700 transition hover:bg-green-100/60 hover:text-green-900 dark:text-green-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <PrimaryButton type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Logging in..." : "Login"}
      </PrimaryButton>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="#"
          className="text-foreground/65 transition hover:text-foreground"
        >
          Forgot password?
        </Link>

        <Link
          href="/register"
          className="font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          Create an account
        </Link>
      </div>

      <DisclaimerBox>
        <strong>Important:</strong> Waypoint is not a medical service. It does
        not diagnose or prescribe.
      </DisclaimerBox>
    </form>
  );
}