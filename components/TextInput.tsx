import * as React from "react";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className = "", type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={joinClasses(
        "w-full rounded-2xl border border-foreground/10 bg-white/88 px-4 py-3 text-sm text-foreground shadow-sm transition",
        "placeholder:text-foreground/45",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "dark:border-white/10 dark:bg-[#21262d] dark:text-slate-100 dark:placeholder:text-slate-400",
        className
      )}
      {...props}
    />
  );
});

export default TextInput;