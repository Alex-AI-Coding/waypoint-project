"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";
import DisclaimerBox from "@/components/DisclaimerBox";
import { createClient } from "@/lib/supabase/browser";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        <TextInput name="name" type="text" placeholder="Your name" />
      </div>

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
        <TextInput
          name="password"
          type="password"
          placeholder="Create a password"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground/80">
          Confirm password
        </label>
        <TextInput
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
        />
      </div>

      <PrimaryButton type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating account..." : "Create account"}
      </PrimaryButton>

      <div className="text-sm">
        <span className="text-foreground/65">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          Login
        </Link>
      </div>

      <DisclaimerBox>
        <strong>Important:</strong> Waypoint is not a medical service. It does
        not diagnose or prescribe.
      </DisclaimerBox>
    </form>
  );
}