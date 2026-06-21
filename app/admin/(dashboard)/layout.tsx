import type { Metadata } from "next";
import type { ReactNode } from "react";
import { adminSignOut } from "@/app/admin/actions";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Button, Container } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin | VELVORZ",
  description: "VELVORZ admin dashboard.",
};

type AdminDashboardLayoutProps = {
  children: ReactNode;
};

export default async function AdminDashboardLayout({
  children,
}: AdminDashboardLayoutProps) {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { data: admin } = await supabase
    .from("admins")
    .select("email")
    .eq("id", user.id)
    .single();

  return (
    <>
      <SiteHeader />
      <main className="bg-surface-container-lowest py-10 md:py-14">
        <Container>
          <div className="flex flex-col gap-4 border-b border-outline-variant pb-6 md:flex-row md:items-end md:justify-between md:pb-8">
            <div>
              <p className="type-label-uppercase text-on-surface-variant">
                Admin
              </p>
              <h1 className="type-headline-lg-mobile md:type-headline-lg mt-2 text-on-surface">
                Dashboard
              </h1>
              {admin?.email ? (
                <p className="type-body-md mt-2 text-on-surface-variant">
                  Signed in as {admin.email}
                </p>
              ) : null}
            </div>

            <form action={adminSignOut}>
              <Button type="submit" variant="ghost">
                Sign Out
              </Button>
            </form>
          </div>

          <div className="mt-8">{children}</div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
