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
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground/80">
          Name
        </label>
        <TextInput
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground/80">
          Email
        </label>
        <TextInput
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground/80">
          Password
        </label>

        <div className="relative">
          <TextInput
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            className="pr-16"
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

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground/80">
          Confirm password
        </label>

        <div className="relative">
          <TextInput
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className="pr-16"
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

      <PrimaryButton type="submit" disabled={isLoading} className="min-h-11 w-full">
        {isLoading ? "Creating account..." : "Create account"}
      </PrimaryButton>

      <div className="text-sm text-foreground/68">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          Login
        </Link>
      </div>
    </form>
  );
}