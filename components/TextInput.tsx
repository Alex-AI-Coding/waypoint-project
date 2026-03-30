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
        "w-full min-h-11 rounded-2xl border border-black/8 bg-white px-4 py-3 text-base text-slate-900 outline-none transition",
        "placeholder:text-foreground/40 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-200/40",
        "dark:border-white/10 dark:bg-[#313743] dark:text-slate-100 dark:focus:border-emerald-400/30 dark:focus:ring-emerald-500/10",
        "sm:text-sm",
        className,
      ].join(" ")}
      {...props}
    />
  );
}