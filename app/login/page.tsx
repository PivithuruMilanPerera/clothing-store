import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth";
import { Button, Input } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sign In | VELVORZ",
  description: "Sign in to your VELVORZ account.",
};

type LoginPageProps = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { registered } = await searchParams;
  const showRegisteredMessage = registered === "1";

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

      <form className="flex flex-col gap-6" action="/login" method="post">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
        <Button type="submit" className="mt-2 w-full">
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}
