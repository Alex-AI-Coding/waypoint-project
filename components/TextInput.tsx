import * as React from "react";

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function TextInput({
  className = "",
  type = "text",
  ...props
}: TextInputProps) {
  return (
    <input
      type={type}
      className={[
        "w-full rounded-xl border px-4 py-3 text-sm transition",
        "bg-background text-foreground placeholder:text-foreground/50",
        "border-foreground/15",
        "focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "dark:focus:ring-green-300/30 dark:focus:border-green-700",
        className,
      ].join(" ")}
      {...props}
    />
  );
}