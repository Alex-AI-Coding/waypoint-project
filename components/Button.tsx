import type { ReactNode } from "react";
import * as React from "react";
import Link from "next/link";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PrimaryButton({
  children,
  type = "button",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={joinClasses(
        "inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition",
        "hover:bg-emerald-700",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 dark:focus:ring-offset-[#272c34]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PrimaryLinkButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={joinClasses(
        "inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition",
        "hover:bg-emerald-700",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 dark:focus:ring-offset-[#272c34]",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function SecondaryLinkButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={joinClasses(
        "inline-flex items-center justify-center rounded-2xl border border-foreground/10 bg-white/80 px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition",
        "hover:bg-white dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 dark:focus:ring-offset-[#272c34]",
        className
      )}
    >
      {children}
    </Link>
  );
}