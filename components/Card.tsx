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
        "rounded-3xl border border-black/6 bg-white/82 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur",
        "dark:border-white/8 dark:bg-[#272c34]/92 dark:shadow-[0_16px_44px_rgba(0,0,0,0.22)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}