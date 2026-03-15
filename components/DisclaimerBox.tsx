import type { ReactNode } from "react";

export default function DisclaimerBox({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-4 text-sm leading-6 shadow-sm",
        "border-emerald-200/90 bg-emerald-50 text-emerald-950",
        "dark:border-emerald-400/20 dark:bg-emerald-500/12 dark:text-emerald-100",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}