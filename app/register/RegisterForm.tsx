"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
          data: { name }, // optional: stored in user metadata
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If email confirmation is ON in Supabase, user may need to confirm first.
      // We’ll still send them to login so it’s clear what to do next.
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
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-900">Name</label>
        <TextInput name="name" type="text" placeholder="Your name" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-900">Email</label>
        <TextInput name="email" type="email" placeholder="you@example.com" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-900">Password</label>
        <TextInput name="password" type="password" placeholder="Create a password" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-900">
          Confirm password
        </label>
        <TextInput
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
        />
      </div>

      <PrimaryButton type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </PrimaryButton>

      <div className="pt-2">
        <DisclaimerBox>
          <strong>Important:</strong> Waypoint is not a medical service. It does
          not diagnose or prescribe.
        </DisclaimerBox>
      </div>
    </form>
  );
}
