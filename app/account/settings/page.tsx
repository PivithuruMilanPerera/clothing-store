import type { Metadata } from "next";
import { signOut } from "@/app/account/actions";
import { Button } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account | VELVORZ",
  description: "Manage your VELVORZ account and sign out.",
};

export default async function AccountSettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || "Account";
  const email = profile?.email || user.email || "";

  return (
    <div>
      <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
        Account
      </h2>
      <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
        Manage your account session and sign out when you are done.
      </p>

      <div className="mt-8 max-w-xl border border-outline-variant bg-surface-container-lowest p-6">
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          Signed in as
        </p>
        <p className="font-headline text-lg font-bold leading-tight mt-2 text-on-surface">
          {displayName}
        </p>
        {email ? (
          <p className="font-body text-base leading-normal mt-1 text-on-surface-variant">
            {email}
          </p>
        ) : null}

        <form action={signOut} className="mt-6">
          <Button type="submit" variant="ghost">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
