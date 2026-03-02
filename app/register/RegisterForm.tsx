"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";
import DisclaimerBox from "@/components/DisclaimerBox";
import { createClient } from "@/lib/supabase/browser";
import Link from "next/link";

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
        options: { data: { name } },
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
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50/60 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <TextInput name="name" placeholder="Your name (optional)" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <TextInput name="email" type="email" placeholder="you@example.com" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>
        <TextInput name="password" type="password" placeholder="At least 8 characters" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Confirm password
        </label>
        <TextInput
          name="confirmPassword"
          type="password"
          placeholder="Re-type your password"
        />
      </div>

      <PrimaryButton type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </PrimaryButton>

<div className="text-center text-sm">
  <span className="opacity-80">Already have an account? </span>
  <Link
    href="/login"
    className="text-green-700 hover:text-green-900 hover:underline dark:text-green-200 dark:hover:text-white"
  >
    Login
  </Link>
</div>

      <DisclaimerBox>
        Important: Waypoint is not a medical service. It does not diagnose or
        prescribe.
      </DisclaimerBox>
    </form>
  );
}