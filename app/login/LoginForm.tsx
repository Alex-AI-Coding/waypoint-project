"use client";

import { useState } from "react";
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
    <form onSubmit={onSubmit} className="space-y-4 animate-fade-in">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-green-900">
          Email
        </label>
        <TextInput
          name="email"
          type="email"
          placeholder="you@example.com"
        />
      </div>

      {/* Password Field with Show/Hide */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-green-900">
          Password
        </label>

        <div className="relative">
          <TextInput
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pr-12"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-green-700 hover:text-green-900 transition"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <PrimaryButton type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </PrimaryButton>

      {/* Links */}
      <div className="flex items-center justify-between text-sm">
        <a
          href="/forgot-password"
          className="text-green-700 hover:text-green-900 transition"
        >
          Forgot password?
        </a>

        <a
          href="/register"
          className="text-green-700 hover:text-green-900 transition"
        >
          Create an account
        </a>
      </div>

      {/* Disclaimer */}
      <div className="pt-2">
        <DisclaimerBox>
          <strong>Important:</strong> Waypoint is not a medical service. It does
          not diagnose or prescribe.
        </DisclaimerBox>
      </div>
    </form>
  );
}
