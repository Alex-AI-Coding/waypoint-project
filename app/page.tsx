import Link from "next/link";
import Image from "next/image";
import Card from "@/components/Card";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_28%),var(--background)] px-4 pb-10">
      <div className="mx-auto max-w-6xl pt-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-8 sm:p-10">
            <div className="flex items-center gap-4">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm dark:border-emerald-400/15 dark:from-emerald-500/10 dark:to-[#2c323b]">
                <Image
                  src="/WaypointIcon.png"
                  alt="Waypoint icon"
                  width={102}
                  height={102}
                  priority
                  className="rounded-lg object-contain"
                />
              </div>

              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Waypoint
                </h1>
                <p className="mt-1 text-base text-foreground/65">
                  A supportive mental health and guidance chatbot.
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:border-emerald-400/15 dark:bg-emerald-500/10 dark:text-emerald-200">
              Supportive chat • Private threads • Comfort-first design
            </div>

            <h2 className="mt-6 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              A calm place to talk, reflect, and keep your conversations organized.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-foreground/72">
              Waypoint offers gentle support, separate chat threads, and a more
              comfortable space to sort through what is on your mind.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full border border-foreground/10 px-6 py-3 text-sm font-semibold text-foreground/85 transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
              >
                Register
              </Link>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              What Waypoint offers
            </h3>
            <p className="mt-2 text-sm text-foreground/70">
              A simpler, calmer space for supportive conversation.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-black/6 bg-foreground/[0.03] p-5 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-base font-semibold text-foreground">
                  Gentle support
                </div>
                <p className="mt-2 text-sm leading-7 text-foreground/70">
                  Calm conversations that feel approachable and supportive.
                </p>
              </div>

              <div className="rounded-2xl border border-black/6 bg-foreground/[0.03] p-5 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-base font-semibold text-foreground">
                  Organized threads
                </div>
                <p className="mt-2 text-sm leading-7 text-foreground/70">
                  Keep different topics in separate conversations you can revisit.
                </p>
              </div>

              <div className="rounded-2xl border border-black/6 bg-foreground/[0.03] p-5 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-base font-semibold text-foreground">
                  Comfort-first design
                </div>
                <p className="mt-2 text-sm leading-7 text-foreground/70">
                  Cleaner spacing and softer visuals for a calmer experience.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <Footer />
      </div>
    </main>
  );
}