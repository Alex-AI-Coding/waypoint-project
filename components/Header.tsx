import Image from "next/image";

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
    <div className="mb-4 flex items-start justify-between">
      <div>
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <Image
            src="/WaypointIcon.png"
            alt="Waypoint logo"
            width={36}
            height={36}
            className="rounded-md"
            priority
          />
          <h1 className="text-xl font-semibold text-green-900">
            {title}
          </h1>
        </div>

        <p className="mt-1 text-sm text-green-700">
          {subtitle}
        </p>
      </div>

      {rightLinkHref && rightLinkLabel && (
        <a
          href={rightLinkHref}
          className="text-sm text-green-700 hover:text-green-900 transition focus:outline-none focus:ring-2 focus:ring-green-200 rounded-lg px-2 py-1"
        >
          {rightLinkLabel}
        </a>
      )}
    </div>
  );
}
