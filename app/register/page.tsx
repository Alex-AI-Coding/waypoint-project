import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="max-w-md w-full">
        <Card>
          <Header
            title="Register"
            subtitle="Please fill out the provided boxes"
            rightLinkHref="/"
            rightLinkLabel="Home"
          />

          <RegisterForm />

          <div className="text-sm text-green-700 mt-4">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-green-700 hover:text-green-900 transition"
            >
              Login
            </a>
          </div>
        </Card>

        <Footer />
      </div>
    </main>
  );
}
