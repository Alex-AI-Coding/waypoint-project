"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { logoutAction } from "@/app/actions/logout";
import ConfirmModal from "@/components/ConfirmModal";

export default function Nav({
  current,
}: {
  current?: "home" | "chat" | "settings";
}) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettingsConfirm, setShowSettingsConfirm] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement | null>(null);

  const base =
    "rounded-lg px-3 py-1 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-200";
  const active =
    "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100";
  const inactive =
    "text-green-700 hover:text-green-900 hover:bg-green-100/60 " +
    "dark:text-green-200 dark:hover:text-white dark:hover:bg-white/10";

  const resolvedCurrent =
    current ??
    (pathname?.startsWith("/settings")
      ? "settings"
      : pathname?.startsWith("/chat")
      ? "chat"
      : "home");

  return (
    <>
      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href="/chat"
          className={`${base} ${resolvedCurrent === "chat" ? active : inactive}`}
        >
          Chat
        </Link>

        <button
          type="button"
          onClick={() => setShowSettingsConfirm(true)}
          className={`${base} ${
            resolvedCurrent === "settings" ? active : inactive
          }`}
        >
          Settings
        </button>

        <form ref={logoutFormRef} action={logoutAction} className="ml-auto">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className={`${base} ${inactive}`}
          >
            Logout
          </button>
        </form>
      </nav>

      <ConfirmModal
        open={showSettingsConfirm}
        title="Open settings?"
        description="Your appearance changes preview instantly in Settings. Saved changes will still need you to press Save changes."
        confirmLabel="Go to settings"
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
        description="You’ll need to sign in again to continue your chats and saved settings."
        confirmLabel="Logout"
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