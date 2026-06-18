import type { Metadata } from "next";
import { AuthLayout, RegisterForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Create Account | VELVORZ",
  description: "Create your VELVORZ account.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create Account"
      description="Join VELVORZ for curated collections and exclusive access."
      alternatePrompt="Already have an account?"
      alternateHref="/login"
      alternateLabel="Sign in"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
