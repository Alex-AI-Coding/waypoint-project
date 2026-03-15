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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-100 to-white shadow-sm dark:border-emerald-400/15 dark:from-emerald-500/10 dark:to-[#2c323b]">
          <Image
            src="/WaypointIcon.png"
            alt="Waypoint logo"
            width={102}
            height={102}
            className="rounded-md"
          />
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-foreground/65">{subtitle}</p>
        </div>
      </div>

      {rightLinkHref && rightLinkLabel ? (
        <Link
          href={rightLinkHref}
          className="inline-flex items-center rounded-full border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
        >
          {rightLinkLabel}
        </Link>
      ) : null}
    </div>
  );
}