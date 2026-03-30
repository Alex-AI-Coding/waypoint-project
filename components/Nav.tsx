"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { logoutAction } from "@/app/actions/logout";

import ConfirmModal from "@/components/ConfirmModal";

export default function Nav({
  current,
  onChatClick,
  onSettingsClick,
}: {
  current?: "home" | "chat" | "settings";
  onChatClick?: () => void;
  onSettingsClick?: () => void;
}) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettingsConfirm, setShowSettingsConfirm] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement | null>(null);

  const resolvedCurrent =
    current ??
    (pathname?.startsWith("/settings")
      ? "settings"
      : pathname?.startsWith("/chat")
        ? "chat"
        : "home");

  const tabBase =
    "inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-300/70 sm:w-auto";

  const active =
    "border border-emerald-300 bg-emerald-100 text-emerald-950 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/14 dark:text-emerald-100";

  const inactive =
    "border border-transparent text-foreground/75 hover:border-foreground/10 hover:bg-white/70 hover:text-foreground dark:text-slate-200/80 dark:hover:border-white/10 dark:hover:bg-white/8 dark:hover:text-white";

  return (
    <>
      <nav className="relative overflow-hidden rounded-[1.5rem] border border-black/6 bg-white/74 px-4 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/82 dark:shadow-[0_16px_44px_rgba(0,0,0,0.22)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-8 top-0 h-20 w-20 rounded-full bg-emerald-300/16 blur-2xl dark:bg-emerald-400/10" />
          <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-sky-300/16 blur-2xl dark:bg-sky-400/10" />
        </div>

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {onChatClick ? (
              <button
                type="button"
                onClick={onChatClick}
                className={`${tabBase} ${
                  resolvedCurrent === "chat" ? active : inactive
                }`}
              >
                Chat
              </button>
            ) : (
              <Link
                href="/chat"
                className={`${tabBase} ${
                  resolvedCurrent === "chat" ? active : inactive
                }`}
              >
                Chat
              </Link>
            )}

            {onSettingsClick ? (
              <button
                type="button"
                onClick={onSettingsClick}
                className={`${tabBase} ${
                  resolvedCurrent === "settings" ? active : inactive
                }`}
              >
                Settings
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSettingsConfirm(true)}
                className={`${tabBase} ${
                  resolvedCurrent === "settings" ? active : inactive
                }`}
              >
                Settings
              </button>
            )}
          </div>

          <form ref={logoutFormRef} action={logoutAction} className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-foreground/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground/80 shadow-sm transition hover:bg-white hover:text-foreground dark:border-white/10 dark:bg-white/6 dark:text-slate-200/85 dark:hover:bg-white/10 dark:hover:text-white sm:w-auto"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>

      <ConfirmModal
        open={showSettingsConfirm}
        title="Go to settings?"
        description="You may have unsaved changes in your current screen."
        confirmLabel="Continue"
        cancelLabel="Stay here"
        onCancel={() => setShowSettingsConfirm(false)}
        onConfirm={() => {
          setShowSettingsConfirm(false);
          window.location.href = "/settings";
        }}
      />

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        description="You’ll need to sign in again to continue your conversations."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logoutFormRef.current?.requestSubmit();
        }}
      />
    </>
  );
}