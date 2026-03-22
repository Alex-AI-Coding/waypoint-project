export default function Footer() {
  return (
    <footer className="mt-8">
      <div className="rounded-[1.5rem] border border-black/6 bg-white/72 px-5 py-4 text-center shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/82 dark:shadow-[0_16px_44px_rgba(0,0,0,0.22)]">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/62">
          <span>Waypoint</span>
          <span className="h-1 w-1 rounded-full bg-emerald-500/70 dark:bg-emerald-300/70" />
          <span>Supportive chat</span>
          <span className="h-1 w-1 rounded-full bg-sky-500/70 dark:bg-sky-300/70" />
          <span>Not medical advice</span>
        </div>

        <p className="mt-3 text-sm leading-6 text-foreground/62">
          If you are in immediate danger, contact local emergency services or a
          trusted person right away.
        </p>
      </div>
    </footer>
  );
}