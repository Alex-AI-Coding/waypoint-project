import Link from "next/link";
import Card from "@/components/Card";
import DisclaimerBox from "@/components/DisclaimerBox";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full">
          <Card>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex justify-center">
  <Image
    src="/WaypointIcon.png"
    alt="Waypoint icon"
    width={112}
    height={112}
    className="rounded-2xl border border-foreground/10"
    priority
  />
</div>
                <div className="text-2xl font-semibold">Waypoint</div>
                <p className="mt-2 text-sm opacity-80">
                  A supportive mental health and guidance chatbot.
                </p>
                <p className="mt-2 text-xs opacity-70">
                  Supportive chat • Not medical advice
                </p>
              </div>

              <div className="mt-5">
                <DisclaimerBox>
                  <span className="font-semibold">Important:</span> Waypoint is
                  not a medical service. It does not diagnose or prescribe. If
                  you are in immediate danger, contact local emergency services
                  or a trusted person.
                </DisclaimerBox>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl border border-green-300 bg-background px-4 py-3 text-center text-sm font-semibold text-green-700 transition hover:bg-green-100/60 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-200 dark:border-green-700 dark:text-green-200 dark:hover:bg-white/10"
                >
                  Register
                </Link>
              </div>

              <div className="mt-6 text-center text-xs opacity-70">
                Waypoint • Supportive chat • Not medical advice
                <br />
                If you are in immediate danger, contact local emergency services
                or a trusted person.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}