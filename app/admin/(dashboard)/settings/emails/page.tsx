import type { Metadata } from "next";
import { EmailTemplatesAdmin } from "@/components/admin/settings/EmailTemplatesAdmin";
import { requireAdmin } from "@/lib/auth";
import { getAllEmailTemplates } from "@/lib/email-templates";

export const metadata: Metadata = {
  title: "Email Templates | Admin | VELVORZ",
  description: "Manage notification email templates.",
};

export default async function AdminEmailTemplatesPage() {
  await requireAdmin();
  const templates = await getAllEmailTemplates();

  return <EmailTemplatesAdmin templates={templates} />;
}
