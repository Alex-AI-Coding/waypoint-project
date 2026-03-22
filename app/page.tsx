import Link from "next/link";
import Image from "next/image";
import Card from "@/components/Card";
import Footer from "@/components/Footer";
import PageEnter from "@/components/PageEnter";

const infoCards = [
  {
    title: "Supportive chat",
    body: "A calmer space to talk through what feels heavy, one message at a time.",
  },
  {
    title: "Private threads",
    body: "Keep conversations organized so it is easier to return to past thoughts.",
  },
  {
    title: "Comfort-first design",
    body: "Soft color, clearer spacing, and a gentler layout throughout the experience.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_24%),var(--background)] px-4 pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-20 h-56 w-56 rounded-full bg-emerald-400/14 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute right-[-4rem] top-28 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-400/10" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-teal-300/12 blur-3xl dark:bg-teal-400/8" />
      </div>

      <PageEnter>
        <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center pt-8">
          <div className="mx-auto w-full max-w-4xl">
            <Card className="relative overflow-hidden border-emerald-100/90 bg-white/84 p-0 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-[#272c34]/92 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />
                <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-400/10" />
              </div>

              <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

              <div className="relative px-6 py-10 sm:px-10 sm:py-14">
                <div className="mx-auto flex items-center justify-center">
                  <Image
                    src="/Waypointicon.png"
                    alt="Waypoint icon"
                    width={62}
                    height={62}
                    priority
                  />
                </div>

                <div className="mt-6 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 shadow-sm dark:border-emerald-400/20 dark:bg-white/6 dark:text-emerald-200">
                    Waypoint
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
                    Calm support
                  </span>
                </div>

                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
                  Welcome to Waypoint
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-700/90 dark:text-slate-300/88 sm:text-[15px]">
                  A supportive mental health and guidance chatbot designed to feel
                  calm, private, and easy to return to.
                </p>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-foreground/68 sm:text-[15px]">
                  Talk through what is on your mind, keep conversations organized,
                  and return to a space built with comfort and clarity in mind.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-2xl border border-foreground/10 bg-white/75 px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
                  >
                    Register
                  </Link>
                </div>

                <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
                  {infoCards.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-black/6 bg-foreground/[0.03] p-4 shadow-sm dark:border-white/8 dark:bg-white/[0.03]"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300/82">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Footer />
        </div>
      </PageEnter>
    </main>
  );
}