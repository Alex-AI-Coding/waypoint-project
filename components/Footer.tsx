export default function Footer() {
  return (
    <footer className="mt-8">
      <div className="rounded-[1.5rem] border border-black/6 bg-white/72 px-4 py-4 text-center shadow-sm backdrop-blur dark:border-white/8 dark:bg-[#272c34]/84 sm:px-5">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
          <span>Waypoint</span>
          <span className="h-1 w-1 rounded-full bg-foreground/25" />
          <span>Supportive chat</span>
          <span className="h-1 w-1 rounded-full bg-foreground/25" />
          <span>Not medical advice</span>
        </div>

        <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-foreground/68">
          If you are in immediate danger, contact local emergency services or a trusted person right away.
        </p>
      </div>
    </footer>
  );
}