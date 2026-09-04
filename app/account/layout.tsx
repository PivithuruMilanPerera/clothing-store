import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";
import { isAdminUser, requireUser } from "@/lib/auth";
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

  if (await isAdminUser(supabase, user.id)) {
    redirect("/admin");
  }

  const [{ data: profile }, { data: address }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("addresses")
      .select("full_name")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const fullName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    address?.full_name?.trim() ||
    "";
  const firstName = fullName.split(/\s+/)[0] || "there";

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
              Hello, {firstName}
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
