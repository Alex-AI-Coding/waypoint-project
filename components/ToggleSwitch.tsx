"use client";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
};

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-4 text-left transition hover:bg-foreground/10"
      aria-pressed={checked}
    >
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        {description ? (
          <p className="mt-1 text-sm text-foreground/70">{description}</p>
        ) : null}
      </div>

      <span
        className={[
          "relative inline-flex h-7 w-12 shrink-0 rounded-full transition",
          checked
            ? "bg-green-600"
            : "bg-zinc-300 dark:bg-zinc-600",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "left-6" : "left-1",
          ].join(" ")}
        />
      </span>
    </button>
  );
}