import * as React from "react";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={[
        "flex w-full items-start justify-between gap-4 rounded-[1.25rem] border border-black/6 bg-white/72 px-4 py-4 text-left shadow-sm transition",
        "hover:bg-white dark:border-white/8 dark:bg-[#222831]/60 dark:hover:bg-[#2a313b]",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300/70",
        "disabled:cursor-not-allowed disabled:opacity-60",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </div>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-foreground/62">
            {description}
          </p>
        ) : null}
      </div>

      <span
        className={[
          "relative mt-0.5 inline-flex h-7 w-12 shrink-0 rounded-full border transition",
          checked
            ? "border-emerald-500 bg-emerald-500/90"
            : "border-black/10 bg-black/10 dark:border-white/10 dark:bg-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition",
            checked ? "left-6" : "left-1",
          ].join(" ")}
        />
      </span>
    </button>
  );
}