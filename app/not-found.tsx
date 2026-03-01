import Card from "@/components/Card";
import DisclaimerBox from "@/components/DisclaimerBox";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="max-w-md w-full">
        <Card>
          <h1 className="text-2xl font-semibold text-green-900">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-green-700">
            The page you’re looking for doesn’t exist (or may have moved).
          </p>

          <div className="mt-6 flex gap-3">
            <a
              href="/"
              className="flex-1 rounded-xl bg-green-700 py-3 text-center text-sm text-white hover:bg-green-600 transition focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              Go home
            </a>
            <a
              href="/chat"
              className="flex-1 rounded-xl border border-green-300 py-3 text-center text-sm text-green-900 hover:bg-green-100 transition focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              Open chat
            </a>
          </div>

          <div className="mt-6">
            <DisclaimerBox>
              <strong>Reminder:</strong> Waypoint is not a medical service and
              does not provide medical advice, diagnosis, or treatment.
            </DisclaimerBox>
          </div>
        </Card>
      </div>
    </main>
  );
}
