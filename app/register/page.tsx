import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_32%),var(--background)] px-4 pb-10">
      <div className="mx-auto max-w-4xl pt-8">
        <Header
          title="Create account"
          subtitle="Create your Waypoint account to access the chat."
        />

        <div className="mt-6">
          <Card className="mx-auto max-w-xl">
            <RegisterForm />
          </Card>
        </div>

        <Footer />
      </div>
    </main>
  );
}