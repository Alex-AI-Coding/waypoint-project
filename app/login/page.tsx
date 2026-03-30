import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import LoginForm from "./LoginForm";
import PageEnter from "@/components/PageEnter";

const featureCards = [
  {
    title: "Private threads",
    body: "Return to past conversations and keep different thoughts organized in one calmer space.",
  },
  {
    title: "Gentle design",
    body: "Soft color, clear spacing, and warm surfaces help the experience feel more welcoming and less clinical.",
  },
  {
    title: "Supportive guidance",
    body: "Waypoint is built to listen with care and help you sort through what feels heavy, one step at a time.",
  },
];

export default function LoginPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_26%),var(--background)] px-4 pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-56 w-56 rounded-full bg-emerald-400/14 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute right-[-4rem] top-32 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-400/10" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-300/12 blur-3xl dark:bg-teal-400/8" />
      </div>

      <PageEnter>
        <div className="relative mx-auto max-w-6xl py-6 sm:pt-8 sm:pb-0">
          <Header
            title="Login"
            subtitle="Welcome back. Please sign in to continue."
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,520px)] lg:items-stretch">
            <Card className="relative overflow-hidden border-emerald-200/70 bg-[linear-gradient(145deg,rgba(236,253,245,0.95),rgba(255,255,255,0.9))] p-0 shadow-[0_22px_60px_rgba(16,185,129,0.10)] dark:border-emerald-400/15 dark:bg-[linear-gradient(145deg,rgba(16,185,129,0.10),rgba(39,44,52,0.96))] dark:shadow-[0_24px_64px_rgba(0,0,0,0.24)]">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-400/12" />
                <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-400/10" />
              </div>

              <div className="relative flex h-full flex-col p-6 sm:p-8 lg:p-9">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/70 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 shadow-sm dark:border-emerald-400/20 dark:bg-white/6 dark:text-emerald-200">
                  Waypoint
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
                  Calm and private
                </div>

                <div className="mt-6 max-w-xl">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-[2.1rem]">
                    Welcome back to a softer, calmer space.
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-700/90 dark:text-slate-300/88 sm:text-[15px]">
                    Sign in to continue your conversations, revisit saved threads,
                    and return to a space designed to feel steady, clear, and easy
                    to come back to.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {featureCards.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/70 bg-white/72 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-none"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300/80">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-emerald-200/70 bg-white/72 p-5 shadow-[0_14px_40px_rgba(16,185,129,0.08)] backdrop-blur dark:border-emerald-400/16 dark:bg-[#1f252d]/80 dark:shadow-[0_16px_42px_rgba(0,0,0,0.18)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/18 to-sky-400/20 text-emerald-900 dark:from-emerald-400/16 dark:to-sky-400/12 dark:text-emerald-100">
                      <span className="text-lg">✦</span>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        A place to pause and begin again
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300/82">
                        Whether you are checking in for a quick conversation or
                        staying a while, Waypoint keeps the experience warm,
                        focused, and easy to settle into.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden border-emerald-100/90 bg-white/88 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#272c34]/94 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />
              <div className="relative p-5 sm:p-8">
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Welcome back
                  </span>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                    Secure login
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Sign in to continue
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    Access your chats, settings, and saved conversations in one
                    calm, familiar place.
                  </p>
                </div>

                <LoginForm />
              </div>
            </Card>
          </div>

          <Footer />
        </div>
      </PageEnter>
    </main>
  );
}