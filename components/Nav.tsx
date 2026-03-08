"use client";

import { logoutAction } from "@/app/actions/logout";
import ConfirmModal from "@/components/ConfirmModal";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function Nav({
  current,
  onNavigate,
}: {
  current?: "home" | "chat" | "settings";
  onNavigate?: (path: string) => boolean | void;
}) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement | null>(null);

  const base =
    "rounded-lg px-3 py-1 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-200";
  const active =
    "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100";
  const inactive =
    "text-green-700 hover:text-green-900 hover:bg-green-100/60 dark:text-green-200 dark:hover:text-white dark:hover:bg-white/10";

  function go(path: string) {
    const result = onNavigate?.(path);
    if (result === false) return;
    router.push(path);
  }

  return (
    <>
      <nav className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go("/chat")}
          className={`${base} ${current === "chat" ? active : inactive}`}
        >
          Chat
        </button>

        <button
          type="button"
          onClick={() => go("/settings")}
          className={`${base} ${current === "settings" ? active : inactive}`}
        >
          Settings
        </button>

        <form ref={logoutFormRef} action={logoutAction} className="hidden" />

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className={`${base} ${inactive} ml-auto`}
        >
          Logout
        </button>
      </nav>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        description="You’ll be signed out of Waypoint on this device."
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