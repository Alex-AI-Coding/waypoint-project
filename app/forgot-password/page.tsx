import Footer from "@/components/Footer";
import Card from "@/components/Card";
import DisclaimerBox from "@/components/DisclaimerBox";
import Header from "@/components/Header";
import TextInput from "@/components/TextInput";
import { PrimaryButton } from "@/components/Button";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="max-w-md w-full">
        <Card>
          <Header
            title="Forgot password"
            subtitle="Insert your email and press send!"
            rightLinkHref="/login"
            rightLinkLabel="Back"
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-900">Email</label>
              <TextInput type="email" placeholder="you@example.com" />
            </div>

            <PrimaryButton>Send reset link</PrimaryButton>

            <div className="pt-2">
              <DisclaimerBox>
                <strong>Important:</strong> Waypoint is not a medical service. It
                does not diagnose or prescribe.
              </DisclaimerBox>
            </div>
          </div>
        </Card>
        <Footer />
      </div>
    </main>
  );
}
