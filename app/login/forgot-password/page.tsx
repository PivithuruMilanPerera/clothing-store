import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout, ForgotPasswordForm } from "@/components/auth";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Reset Password | VELVORZ",
  description: "Request a password reset link for your VELVORZ account.",
};

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/account/settings");
  }

  return (
    <AuthLayout
      title="Reset Password"
      description="Enter your email and we will send you a link to reset your password."
      alternatePrompt="Remember your password?"
      alternateHref="/login"
      alternateLabel="Sign in"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
