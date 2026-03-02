"use client";

import * as React from "react";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* overlay */}
      <button
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/40 dark:bg-black/60"
      />

      {/* modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-foreground/10 bg-background text-foreground shadow-xl">
        <div className="p-5">
          <div className="text-lg font-semibold">{title}</div>
          {description && (
            <div className="mt-2 text-sm opacity-80">{description}</div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}