import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin";
import { AuthLayout } from "@/components/auth";
import { getSessionAdmin, sanitizeAdminRedirectPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Sign In | VELVORZ",
  description: "Sign in to the VELVORZ admin dashboard.",
};

type AdminLoginPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const admin = await getSessionAdmin();

  if (admin) {
    redirect("/admin");
  }

  const { redirect: redirectParam, error } = await searchParams;
  const redirectTo = sanitizeAdminRedirectPath(redirectParam);
  const showUnauthorizedMessage = error === "unauthorized";

  return (
    <AuthLayout
      title="Admin Sign In"
      description="Enter your admin credentials to access the dashboard."
      alternatePrompt="Back to store"
      alternateHref="/"
      alternateLabel="Home"
    >
      {showUnauthorizedMessage ? (
        <p className="type-body-md mb-6 text-center text-error" role="alert">
          Admin access is required to view that page.
        </p>
      ) : null}

      <AdminLoginForm redirectTo={redirectTo} />
    </AuthLayout>
  );
}
