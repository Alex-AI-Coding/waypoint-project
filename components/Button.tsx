import type { ReactNode } from "react";
import * as React from "react";

export function PrimaryButton({
  children,
  type = "button",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type={type}
      {...props}
      className={
        "w-full rounded-xl bg-green-700 py-3 text-sm text-white hover:bg-green-600 transition focus:outline-none focus:ring-2 focus:ring-green-200 " +
        className
      }
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
    <a
      href={href}
      className="inline-flex w-full items-center justify-center rounded-xl bg-green-700 py-3 text-sm text-white hover:bg-green-600 transition focus:outline-none focus:ring-2 focus:ring-green-200"
    >
      {children}
    </a>
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
    <a
      href={href}
      className="inline-flex w-full items-center justify-center rounded-xl border border-green-300 py-3 text-sm text-green-900 hover:bg-green-100 transition focus:outline-none focus:ring-2 focus:ring-green-200"
    >
      {children}
    </a>
  );
}
