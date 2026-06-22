import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Reset Password | VELVORZ",
  description: "Set a new password for your VELVORZ account.",
};

export default async function ResetPasswordPage() {
  await requireUser();

  return (
    <div>
      <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
        Reset Password
      </h2>
      <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
        Enter a new password for your account.
      </p>

      <div className="mt-8 max-w-xl border border-outline-variant bg-surface-container-lowest p-6">
        <ResetPasswordForm showEmailReset={false} />
      </div>
    </div>
  );
}
