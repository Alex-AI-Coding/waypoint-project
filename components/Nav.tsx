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
    "inline-flex items-center rounded-full px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-300/70";
  const active =
    "bg-emerald-100 text-emerald-950 shadow-sm dark:bg-emerald-500/14 dark:text-emerald-100 dark:ring-1 dark:ring-emerald-400/18";
  const inactive =
    "text-emerald-800 hover:bg-emerald-100/80 hover:text-emerald-950 dark:text-emerald-100/80 dark:hover:bg-white/6 dark:hover:text-white";

  return (
    <>
      <div className="mx-auto mt-4 flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border border-black/6 bg-white/80 px-3 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/90 dark:shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-2">
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

        <form ref={logoutFormRef} action={logoutAction}>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="rounded-full border border-foreground/10 px-3.5 py-2 text-sm font-medium text-foreground/80 transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
          >
            Logout
          </button>
        </form>
      </div>

      <ConfirmModal
        open={showSettingsConfirm}
        title="Open settings?"
        description="Your current chat will stay right where it is."
        confirmLabel="Open settings"
        cancelLabel="Stay here"
        onCancel={() => setShowSettingsConfirm(false)}
        onConfirm={() => {
          setShowSettingsConfirm(false);
          window.location.href = "/settings";
        }}
      />

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out of Waypoint?"
        description="You can always log back in later."
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