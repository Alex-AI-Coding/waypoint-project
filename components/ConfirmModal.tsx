"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-black/6 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#272c34]/96 dark:shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-8 top-0 h-24 w-24 rounded-full bg-emerald-300/18 blur-2xl dark:bg-emerald-400/10" />
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-300/18 blur-2xl dark:bg-sky-400/10" />
        </div>

        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

        <div className="relative p-6 sm:p-7">
          <div className="mb-4">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              Confirm action
            </span>
          </div>

          <h2
            id="confirm-modal-title"
            className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {title}
          </h2>

          {description ? (
            <p
              id="confirm-modal-description"
              className="mt-3 text-sm leading-6 text-foreground/68"
            >
              {description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-2xl border border-foreground/10 bg-white/80 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}