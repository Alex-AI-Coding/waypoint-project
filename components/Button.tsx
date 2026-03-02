import type { ReactNode } from "react";
import * as React from "react";
import Link from "next/link";

export function PrimaryButton({
  children,
  type = "button",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type={type}
      className={[
        "rounded-xl px-4 py-3 text-sm font-semibold transition",
        "bg-green-600 text-white hover:bg-green-700",
        "focus:outline-none focus:ring-2 focus:ring-green-200",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export function PrimaryLinkButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition",
        "bg-green-600 text-white hover:bg-green-700",
        "focus:outline-none focus:ring-2 focus:ring-green-200",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function SecondaryLinkButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition",
        "border-green-300 bg-background text-green-700 hover:bg-green-100/60 hover:text-green-900",
        "focus:outline-none focus:ring-2 focus:ring-green-200",
        "dark:border-green-700 dark:text-green-200 dark:hover:bg-white/10 dark:hover:text-white",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}