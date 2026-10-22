"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  previewEmailTemplateAction,
  resetEmailTemplateAction,
  saveEmailTemplateAction,
} from "@/app/admin/(dashboard)/settings/emails/actions";
import {
  AdminBadge,
  AdminNotice,
  AdminPageHeader,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import type { EmailTemplateContent } from "@/lib/email-template-defaults";
import type { ResolvedEmailTemplate } from "@/lib/email-templates";
import { cn } from "@/lib/utils";

type Field = "subject" | "heading" | "intro" | "footer";

function toContent(template: ResolvedEmailTemplate): EmailTemplateContent {
  return {
    subject: template.subject,
    heading: template.heading,
    intro: template.intro,
    footer: template.footer,
    is_enabled: template.is_enabled,
  };
}

function TemplateEditor({ template }: { template: ResolvedEmailTemplate }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState<EmailTemplateContent>(() => toContent(template));
  const [cursor, setCursor] = useState<{ field: Field; start: number; end: number } | null>(
    null,
  );
  const activeField = cursor?.field ?? "intro";
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await previewEmailTemplateAction(template.key, content);
      if (!cancelled && "html" in result) setPreview(result);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [template.key, content]);

  function update(field: Field, value: string) {
    setContent((current) => ({ ...current, [field]: value }));
  }

  function insertVariable(variable: string) {
    const token = `{{${variable}}}`;
    const value = content[activeField];
    const start = Math.min(cursor?.start ?? value.length, value.length);
    const end = Math.min(cursor?.end ?? value.length, value.length);
    update(activeField, `${value.slice(0, start)}${token}${value.slice(end)}`);
    const caret = start + token.length;
    setCursor({ field: activeField, start: caret, end: caret });
  }

  function trackCursor(field: Field, element: HTMLInputElement | HTMLTextAreaElement) {
    setCursor({
      field,
      start: element.selectionStart ?? element.value.length,
      end: element.selectionEnd ?? element.value.length,
    });
  }

  function run(action: () => Promise<{ success: boolean; error?: string }>, done: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setFeedback({ tone: "error", text: result.error || "Action failed." });
        return;
      }
      setFeedback({ tone: "success", text: done });
      router.refresh();
    });
  }

  const fieldProps = (field: Field) => ({
    value: content[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      update(field, event.target.value);
      trackCursor(field, event.target);
    },
    onSelect: (event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      trackCursor(field, event.currentTarget),
    className: adminInputClass,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <AdminBadge>{template.audience === "admin" ? "Admin inbox" : "Customer"}</AdminBadge>
          {template.isCustomized ? (
            <AdminBadge className="border-primary/30 bg-primary/10 text-primary">
              Customized {template.updated_at ? formatAdminDate(template.updated_at, false) : ""}
            </AdminBadge>
          ) : (
            <AdminBadge>Default copy</AdminBadge>
          )}
        </div>
        <p className="font-body text-sm text-on-surface-variant">{template.description}</p>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={content.is_enabled}
            onChange={(event) =>
              setContent((current) => ({ ...current, is_enabled: event.target.checked }))
            }
          />
          <span className="font-body text-sm text-on-surface">Send this email</span>
        </label>

        <label className="block">
          <span className={adminLabelClass}>Subject</span>
          <input {...fieldProps("subject")} />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Heading</span>
          <input {...fieldProps("heading")} />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Intro</span>
          <textarea rows={4} {...fieldProps("intro")} />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Footer note</span>
          <textarea rows={3} {...fieldProps("footer")} />
        </label>

        <div>
          <p className={adminLabelClass}>Insert placeholder into {activeField}</p>
          <div className="flex flex-wrap gap-1.5">
            {template.variables.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => insertVariable(variable)}
                className="font-body border border-outline-variant bg-surface-container-low px-2 py-1 text-xs text-on-surface hover:border-primary"
              >
                {`{{${variable}}}`}
              </button>
            ))}
          </div>
        </div>

        {feedback ? <AdminNotice tone={feedback.tone}>{feedback.text}</AdminNotice> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => saveEmailTemplateAction(template.key, content), "Template saved.")
            }
            className={adminPrimaryButtonClass}
          >
            {isPending ? "Saving..." : "Save template"}
          </button>
          {template.isCustomized ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                run(() => resetEmailTemplateAction(template.key), "Template reset to default.")
              }
              className={adminSecondaryButtonClass}
            >
              Reset to default
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <p className={adminLabelClass}>Preview (sample data)</p>
        <p className="font-body mb-2 truncate border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
          <span className="text-on-surface-variant">Subject: </span>
          {preview?.subject ?? "…"}
        </p>
        <iframe
          title={`${template.label} preview`}
          srcDoc={preview?.html ?? ""}
          sandbox=""
          className="h-[640px] w-full border border-outline-variant bg-white"
        />
      </div>
    </div>
  );
}

export function EmailTemplatesAdmin({ templates }: { templates: ResolvedEmailTemplate[] }) {
  const [selectedKey, setSelectedKey] = useState(templates[0]?.key);
  const selected = templates.find((template) => template.key === selectedKey) ?? templates[0];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Platform settings"
        title="Email templates"
        description="Customize the wording of every notification email. Order details, items and totals are added automatically below your intro text."
      />

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label="Email templates" className="border border-outline-variant bg-surface-container-lowest">
          {(["customer", "admin"] as const).map((audience) => (
            <div key={audience}>
              <p className="border-b border-outline-variant px-4 py-3 font-label text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                {audience === "customer" ? "Customer emails" : "Admin alerts"}
              </p>
              <ul>
                {templates
                  .filter((template) => template.audience === audience)
                  .map((template) => (
                    <li key={template.key}>
                      <button
                        type="button"
                        onClick={() => setSelectedKey(template.key)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 border-b border-outline-variant/50 px-4 py-2.5 text-left font-body text-sm",
                          template.key === selected?.key
                            ? "bg-primary text-on-primary"
                            : "text-on-surface hover:bg-surface-container-low",
                        )}
                      >
                        <span className="truncate">{template.label}</span>
                        {!template.is_enabled ? (
                          <span className="text-[10px] uppercase opacity-70">Off</span>
                        ) : template.isCustomized ? (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        ) : null}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>

        <section className="min-w-0 border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
          {selected ? (
            <>
              <h2 className="font-headline mb-4 text-lg font-bold uppercase text-on-surface">
                {selected.label}
              </h2>
              <TemplateEditor
                key={`${selected.key}:${selected.updated_at ?? "default"}`}
                template={selected}
              />
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
