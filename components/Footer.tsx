export default function Footer() {
  return (
    <footer className="mx-auto mt-8 max-w-6xl rounded-2xl border border-black/6 bg-white/70 px-4 py-4 text-center text-sm text-foreground/65 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur dark:border-white/8 dark:bg-[#272c34]/85 dark:text-foreground/70">
      <div className="font-medium text-foreground/80">
        Waypoint • Supportive chat • Not medical advice
      </div>
      <p className="mt-1">
        If you are in immediate danger, contact local emergency services or a
        trusted person right away.
      </p>
    </footer>
  );
}