import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[1.75rem] border border-black/6 bg-white/78 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/84 dark:shadow-[0_18px_54px_rgba(0,0,0,0.24)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}