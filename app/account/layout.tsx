import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountNav } from "@/components/account";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";
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
          <div className=" pb-3">
            <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
              My Account
            </p>
            <h1 className="font-headline text-[2rem] font-extrabold leading-tight uppercase md:text-5xl md:tracking-tight mt-2 text-on-surface">
              Hello, {displayName.split(" ")[0]}
            </h1>
          </div>

          <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:gap-16">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <AccountNav />
            </aside>

            <div>{children}</div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
