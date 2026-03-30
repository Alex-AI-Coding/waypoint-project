import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import RegisterForm from "./RegisterForm";
import PageEnter from "@/components/PageEnter";

export default function RegisterPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.14),transparent_24%),var(--background)] px-4 pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-24 h-56 w-56 rounded-full bg-emerald-400/14 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute right-[-4rem] top-36 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-400/10" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-teal-300/12 blur-3xl dark:bg-teal-400/8" />
      </div>

      <PageEnter>
        <div className="relative mx-auto max-w-3xl py-6 sm:pt-8 sm:pb-0">
          <Header
            title="Create account"
            subtitle="Set up your Waypoint account and begin in a calmer, more private space."
          />

          <div className="mt-8">
            <Card className="relative overflow-hidden border-emerald-100/90 bg-white/88 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#272c34]/94 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

              <div className="relative p-5 sm:p-8">
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    New account
                  </span>

                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                    Private setup
                  </span>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Create your account
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    Set up your account to access chats, preferences, and future conversations in one familiar place.
                  </p>
                </div>

                <RegisterForm />
              </div>
            </Card>
          </div>

          <Footer />
        </div>
      </PageEnter>
    </main>
  );
}