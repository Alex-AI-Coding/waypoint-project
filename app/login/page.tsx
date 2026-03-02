import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full">
          <Header />

          <div className="mt-6">
            <Card>
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold">Login</h2>
                <p className="mt-1 text-sm opacity-80">
                  Welcome back. Please sign in to continue.
                </p>

                <div className="mt-5">
                  <LoginForm />
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}