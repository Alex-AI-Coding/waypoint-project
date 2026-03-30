"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";
import { createClient } from "@/lib/supabase/browser";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!email || !password) {
      setError("Please enter an email and password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {error ? (
        <p className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Name
          </label>
          <TextInput name="name" placeholder="Your name" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
          </label>
          <TextInput
            name="email"
            type="email"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
          </label>
          <div className="relative">
            <TextInput
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Confirm password
          </label>
          <div className="relative">
            <TextInput
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute inset-y-0 right-3 my-auto h-8 rounded-lg px-2 text-xs font-medium text-green-700 transition hover:bg-green-100/60 hover:text-green-900 dark:text-green-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <PrimaryButton type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </PrimaryButton>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-green-700 dark:text-green-300"
          >
            Login
          </Link>
        </p>
      </form>
    </>
  );
}