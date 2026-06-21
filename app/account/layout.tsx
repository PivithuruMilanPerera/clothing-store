import type { Metadata } from "next";
import type { ReactNode } from "react";
import { signOut } from "@/app/account/actions";
import { AccountNav } from "@/components/account";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Button, Container } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Account | VELVORZ",
  description: "Manage your VELVORZ account, orders, and addresses.",
};

type AccountLayoutProps = {
  children: ReactNode;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || profile?.email || "Account";

  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <div className="border-b border-outline-variant pb-6 md:pb-8">
            <p className="type-label-uppercase text-on-surface-variant">
              My Account
            </p>
            <h1 className="type-headline-lg-mobile md:type-headline-lg mt-2 text-on-surface">
              Hello, {displayName.split(" ")[0]}
            </h1>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:gap-16">
            <aside className="space-y-6">
              <AccountNav />
              <form action={signOut}>
                <Button type="submit" variant="ghost" className="w-full">
                  Sign Out
                </Button>
              </form>
            </aside>

            <div>{children}</div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
