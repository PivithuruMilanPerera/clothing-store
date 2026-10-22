"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin, requireAdmin } from "@/lib/auth";
import {
  isEmailTemplateKey,
  type EmailTemplateContent,
} from "@/lib/email-template-defaults";
import { buildEmailPreview } from "@/lib/order-emails";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

type Result = { success: boolean; error?: string };

function validate(content: EmailTemplateContent): string | null {
  if (!content.subject.trim()) return "Subject is required.";
  if (!content.heading.trim()) return "Heading is required.";
  if (!content.intro.trim()) return "Intro text is required.";
  if (content.subject.length > 200) return "Subject must be under 200 characters.";
  if (content.intro.length > 2000 || content.footer.length > 2000) {
    return "Body text must be under 2,000 characters.";
  }
  return null;
}

export async function saveEmailTemplateAction(
  key: string,
  content: EmailTemplateContent,
): Promise<Result> {
  await requireAdmin();
  if (!isEmailTemplateKey(key)) return { success: false, error: "Unknown template." };
  if (!hasAdminCredentials()) return { success: false, error: "Missing admin credentials." };

  const error = validate(content);
  if (error) return { success: false, error };

  const admin = await getCurrentAdmin();
  const { error: saveError } = await createAdminClient()
    .from("email_templates")
    .upsert({
      key,
      subject: content.subject.trim(),
      heading: content.heading.trim(),
      intro: content.intro.trim(),
      footer: content.footer.trim(),
      is_enabled: content.is_enabled,
      updated_at: new Date().toISOString(),
      updated_by: admin?.id ?? null,
    });

  if (saveError) {
    return {
      success: false,
      error: /email_templates/.test(saveError.message)
        ? "The email_templates table is missing. Run supabase/milestone-4-admin-migration.sql first."
        : saveError.message,
    };
  }

  revalidatePath("/admin/settings/emails");
  return { success: true };
}

export async function resetEmailTemplateAction(key: string): Promise<Result> {
  await requireAdmin();
  if (!isEmailTemplateKey(key)) return { success: false, error: "Unknown template." };
  if (!hasAdminCredentials()) return { success: false, error: "Missing admin credentials." };

  const { error } = await createAdminClient().from("email_templates").delete().eq("key", key);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/settings/emails");
  return { success: true };
}

export async function previewEmailTemplateAction(
  key: string,
  content: EmailTemplateContent,
): Promise<{ subject: string; html: string } | { error: string }> {
  await requireAdmin();
  if (!isEmailTemplateKey(key)) return { error: "Unknown template." };

  return buildEmailPreview(key, content);
}
