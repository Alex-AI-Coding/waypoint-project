"use client";

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
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      className="flex w-full items-start justify-between gap-4 rounded-[1.5rem] border border-black/6 bg-white/72 px-4 py-4 text-left shadow-sm transition hover:bg-white/86 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
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
          "relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
          checked
            ? "border-emerald-400 bg-emerald-500/90 dark:border-emerald-300 dark:bg-emerald-500"
            : "border-foreground/10 bg-foreground/10 dark:border-white/10 dark:bg-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </span>
    </button>
  );
}