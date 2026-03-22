import Image from "next/image";
import Link from "next/link";

export default function Header({
  title = "Waypoint",
  subtitle = "Supportive chat • Not medical advice",
  rightLinkHref,
  rightLinkLabel,
}: {
  title?: string;
  subtitle?: string;
  rightLinkHref?: string;
  rightLinkLabel?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/6 bg-white/78 px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/84 dark:shadow-[0_18px_54px_rgba(0,0,0,0.24)] sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-8 top-0 h-24 w-24 rounded-full bg-emerald-300/18 blur-2xl dark:bg-emerald-400/10" />
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-300/18 blur-2xl dark:bg-sky-400/10" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center">
              <Image
                src="/Waypointicon.png"
                alt="Waypoint icon"
                width={168}
                height={168}
                priority
              />
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800 shadow-sm dark:border-emerald-400/20 dark:bg-white/6 dark:text-emerald-200">
              Waypoint
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
              Calm support
            </span>
          </div>

          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            {title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/68">
            {subtitle}
          </p>
        </div>

        {rightLinkHref && rightLinkLabel ? (
          <div className="shrink-0">
            <Link
              href={rightLinkHref}
              className="inline-flex items-center justify-center rounded-2xl border border-foreground/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
            >
              {rightLinkLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}