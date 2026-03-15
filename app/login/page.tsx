import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_32%),var(--background)] px-4 pb-10">
      <div className="mx-auto max-w-4xl pt-8">
        <Header
          title="Login"
          subtitle="Welcome back. Please sign in to continue."
        />

        <div className="mt-6">
          <Card className="mx-auto max-w-xl">
            <LoginForm />
          </Card>
        </div>

        <Footer />
      </div>
    </main>
  );
}