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
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50/60 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <TextInput name="email" type="email" placeholder="you@example.com" />
      </div>

      {/* Password */}
      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>

        <div className="relative">
          <TextInput
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            className="pr-20"
          />

          <button
            type="button"
            onClick={() => setShowPassword((v: boolean) => !v)}
            className="absolute inset-y-0 right-3 my-auto h-8 rounded-lg px-2 text-xs font-medium transition
                       text-green-700 hover:text-green-900 hover:bg-green-100/60
                       dark:text-green-200 dark:hover:text-white dark:hover:bg-white/10"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Submit */}
      <PrimaryButton type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </PrimaryButton>

      {/* Links */}
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="text-green-700 hover:text-green-900 hover:underline dark:text-green-200 dark:hover:text-white"
        >
          Forgot password?
        </Link>

        <Link
          href="/register"
          className="text-green-700 hover:text-green-900 hover:underline dark:text-green-200 dark:hover:text-white"
        >
          Create an account
        </Link>
      </div>

      {/* Disclaimer */}
      <DisclaimerBox>
        Important: Waypoint is not a medical service. It does not diagnose or
        prescribe.
      </DisclaimerBox>
    </form>
  );
}