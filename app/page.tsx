import Link from "next/link";
import Image from "next/image";
import Card from "@/components/Card";
import DisclaimerBox from "@/components/DisclaimerBox";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.09),transparent_32%),var(--background)] px-4 pb-10">
      <div className="mx-auto max-w-6xl pt-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-8 sm:p-10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-100 to-white shadow-sm dark:border-emerald-400/15 dark:from-emerald-500/10 dark:to-[#2c323b]">
                <Image
                  src="/waypointlogo.png"
                  alt="Waypoint icon"
                  width={38}
                  height={38}
                  className="rounded-md"
                />
              </div>

              <div>
                <h1 className="text-4xl font-semibold tracking-tight">Waypoint</h1>
                <p className="mt-1 text-sm text-foreground/65">
                  A supportive mental health and guidance chatbot.
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-2xl">
              <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:border-emerald-400/15 dark:bg-emerald-500/10 dark:text-emerald-200">
                Supportive chat • Not medical advice
              </div>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
                A calmer, friendlier space to talk things through.
              </h2>

              <p className="mt-4 text-base leading-7 text-foreground/72">
                Waypoint gives gentle conversation, practical reflection, and a
                private place to organize your thoughts one thread at a time.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full border border-foreground/10 px-5 py-3 text-sm font-semibold text-foreground/85 transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
              >
                Register
              </Link>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-lg font-semibold">Important</h3>
            <p className="mt-1 text-sm text-foreground/70">
              Waypoint is supportive, but it is not a medical service.
            </p>

            <div className="mt-4">
              <DisclaimerBox>
                <strong>Important:</strong> Waypoint is not a medical service. It
                does not diagnose or prescribe. If you are in immediate danger,
                contact local emergency services or a trusted person right away.
              </DisclaimerBox>
            </div>

            <div className="mt-6 rounded-2xl border border-black/6 bg-foreground/[0.03] p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold">What Waypoint is for</div>
              <p className="mt-2 text-sm leading-6 text-foreground/70">
                Gentle check-ins, reflection, emotional support, and organized
                conversations.
              </p>
            </div>
          </Card>
        </section>

        <Footer />
      </div>
    </main>
  );
}