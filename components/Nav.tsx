"use client";

import { logoutAction } from "@/app/actions/logout";
import ConfirmModal from "@/components/ConfirmModal";
import { useRef, useState } from "react";

export default function Nav({
  current,
}: {
  current?: "home" | "chat" | "settings";
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement>(null);

  const base =
    "rounded-lg px-3 py-1 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-200";
  const active = "bg-green-100 text-green-900";
  const inactive =
    "text-green-700 hover:text-green-900 hover:bg-green-100/60";

  return (
    <>
      <nav className="flex gap-2 items-center">
  <a
    href="/chat"
    className={`${base} ${current === "chat" ? active : inactive}`}
  >
    Chat
  </a>

  <a
    href="/settings"
    className={`${base} ${current === "settings" ? active : inactive}`}
  >
    Settings
  </a>

  {/* Hidden logout form */}
  <form ref={logoutFormRef} action={logoutAction} className="ml-auto" />

  <button
    onClick={() => setShowLogoutConfirm(true)}
    className={`${base} ${inactive} ml-auto`}
  >
    Logout
  </button>
</nav>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        description="You will need to log in again to continue."
        confirmLabel="Log out"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logoutFormRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
