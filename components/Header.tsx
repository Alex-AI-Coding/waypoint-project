"use client";

import Link from "next/link";

type HeaderProps = {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function Header({
  title,
  subtitle,
  actionHref,
  actionLabel,
}: HeaderProps) {
  return (
    <header className="mb-6 rounded-[1.75rem] border border-black/6 bg-white/76 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/84 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-lg font-semibold text-emerald-700 shadow-inner dark:bg-emerald-400/12 dark:text-emerald-300">
              W
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/80 dark:text-emerald-300/80">
                Waypoint
              </p>
              <p className="text-sm text-foreground/60 dark:text-slate-300/70">
                Your AI companion
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm text-foreground/70 dark:text-slate-300/75">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actionHref && actionLabel ? (
          <div className="flex justify-center sm:justify-end">
            <Link
              href={actionHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-foreground/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground/80 shadow-sm transition hover:bg-white hover:text-foreground dark:border-white/10 dark:bg-white/6 dark:text-slate-200/85 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}