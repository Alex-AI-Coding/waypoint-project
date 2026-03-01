"use server";

export async function registerAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  // For now, we do nothing else yet (Supabase comes later).
  return { error: null };
}
