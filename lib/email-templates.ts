import "server-only";

import {
  EMAIL_TEMPLATE_DEFINITIONS,
  getEmailTemplateDefinition,
  type EmailTemplateContent,
  type EmailTemplateDefinition,
  type EmailTemplateKey,
} from "@/lib/email-template-defaults";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";

export type ResolvedEmailTemplate = EmailTemplateDefinition & {
  isCustomized: boolean;
  updated_at: string | null;
};

type EmailTemplateRow = EmailTemplateContent & {
  key: string;
  updated_at: string;
};

async function loadOverrides(): Promise<Map<string, EmailTemplateRow>> {
  const overrides = new Map<string, EmailTemplateRow>();

  if (!hasAdminCredentials()) {
    return overrides;
  }

  try {
    const { data, error } = await createAdminClient()
      .from("email_templates")
      .select("key, subject, heading, intro, footer, is_enabled, updated_at");

    if (error || !data) {
      return overrides;
    }

    for (const row of data as EmailTemplateRow[]) {
      overrides.set(row.key, row);
    }
  } catch {
    // Fall back to built-in copy.
  }

  return overrides;
}

function merge(
  definition: EmailTemplateDefinition,
  override: EmailTemplateRow | undefined,
): ResolvedEmailTemplate {
  if (!override) {
    return { ...definition, isCustomized: false, updated_at: null };
  }

  return {
    ...definition,
    subject: override.subject?.trim() || definition.subject,
    heading: override.heading?.trim() || definition.heading,
    intro: override.intro?.trim() || definition.intro,
    footer: override.footer?.trim() || definition.footer,
    is_enabled: override.is_enabled !== false,
    isCustomized: true,
    updated_at: override.updated_at,
  };
}

export async function getEmailTemplate(
  key: EmailTemplateKey,
): Promise<ResolvedEmailTemplate> {
  const overrides = await loadOverrides();
  return merge(getEmailTemplateDefinition(key), overrides.get(key));
}

export async function getAllEmailTemplates(): Promise<ResolvedEmailTemplate[]> {
  const overrides = await loadOverrides();
  return EMAIL_TEMPLATE_DEFINITIONS.map((definition) =>
    merge(definition, overrides.get(definition.key)),
  );
}
