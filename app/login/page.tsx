import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout, LoginForm } from "@/components/auth";
import { getSessionUser, sanitizeRedirectPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In | VELVORZ",
  description: "Sign in to your VELVORZ account.",
};

type LoginPageProps = {
  searchParams: Promise<{ registered?: string; redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user) {
    redirect("/account");
  }

  const { registered, redirect: redirectParam } = await searchParams;
  const showRegisteredMessage = registered === "1";
  const redirectTo = sanitizeRedirectPath(redirectParam);

  return (
    <AuthLayout
      title="Sign In"
      description="Welcome back. Enter your details to access your account."
      alternatePrompt="Don't have an account?"
      alternateHref="/register"
      alternateLabel="Create one"
    >
      {showRegisteredMessage ? (
        <p className="type-body-md mb-6 text-center text-on-surface" role="status">
          Account created successfully. Please sign in.
        </p>
      ) : null}

      <LoginForm redirectTo={redirectTo} />
    </AuthLayout>
  );
}
