import Link from "next/link";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import PageEnter from "@/components/PageEnter";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_24%),var(--background)] px-4 pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-24 h-56 w-56 rounded-full bg-emerald-400/14 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute right-[-4rem] top-32 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-400/10" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-300/12 blur-3xl dark:bg-teal-400/8" />
      </div>
      <PageEnter>
      <div className="relative mx-auto max-w-3xl pt-8">
        <Header
          title="Page not found"
          subtitle="The page you were looking for is not here, but you can still find your way back."
        />

        <div className="mt-8">
          <Card className="relative overflow-hidden border-emerald-100/90 bg-white/88 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#272c34]/94 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />

            <div className="relative p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  404
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
                  Navigation help
                </span>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Choose where to go next
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground/68">
                  This page is unavailable. You can head back home or continue to
                  your chat space.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/"
                  className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Go to home
                </Link>

                <Link
                  href="/chat"
                  className="flex w-full items-center justify-center rounded-2xl border border-foreground/10 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-foreground/5 dark:border-white/10 dark:hover:bg-white/6"
                >
                  Go to chat
                </Link>
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