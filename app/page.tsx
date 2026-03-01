import Image from "next/image";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import DisclaimerBox from "@/components/DisclaimerBox";
import { PrimaryLinkButton, SecondaryLinkButton } from "@/components/Button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="max-w-xl w-full">
        <Card>
          {/* Logo + Title */}
          <div className="flex flex-col items-center text-center">
            <Image
              src="/WaypointIcon.png"
              alt="Waypoint logo"
              width={128}
              height={128}
              className="rounded-lg mb-4"
              priority
            />

            <h1 className="text-3xl font-semibold text-green-900">
              Waypoint
            </h1>

            <p className="mt-2 text-green-700">
              A supportive mental health and guidance chatbot.
            </p>

            <p className="mt-3 text-xs text-green-700">
              Supportive chat • Not medical advice
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <DisclaimerBox>
              <strong>Important:</strong> Waypoint is not a medical service. It
              does not diagnose or prescribe. If you are in immediate danger,
              contact local emergency services or a trusted person.
            </DisclaimerBox>

            <div className="flex gap-3">
              <div className="flex-1">
                <PrimaryLinkButton href="/login">
                  Login
                </PrimaryLinkButton>
              </div>
              <div className="flex-1">
                <SecondaryLinkButton href="/register">
                  Register
                </SecondaryLinkButton>
              </div>
            </div>
          </div>
        </Card>

        <Footer />
      </div>
    </main>
  );
}
