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
        "rounded-xl border p-4 text-sm leading-6",
        "border-green-200 bg-green-100 text-green-900",
        "dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}