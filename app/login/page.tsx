import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Header from "@/components/Header";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="max-w-md w-full">
        <Card>
          <Header
            title="Login"
            subtitle="Please type in your email and password"
            rightLinkHref="/"
            rightLinkLabel="Home"
          />

          <LoginForm />
        </Card>

        <Footer />
      </div>
    </main>
  );
}
