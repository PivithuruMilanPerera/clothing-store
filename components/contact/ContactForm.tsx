"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactState } from "@/app/contact/actions";
import { contactSubjects } from "@/data/contact";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

const initialState: ContactState | null = null;

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState,
  );

  if (state?.success) {
    return (
      <div
        className="border border-primary bg-surface-container-low p-8 md:p-10"
        role="status"
      >
        <h2 className="type-headline-md text-on-surface">Message Sent</h2>
        <p className="type-body-md mt-4 text-on-surface-variant">
          {state.success}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Full Name"
          type="text"
          name="name"
          autoComplete="name"
          required
          disabled={isPending}
        />
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="subject" className="type-label-uppercase text-on-surface">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            required
            disabled={isPending}
            className="border-b border-primary bg-transparent pb-2 text-on-surface outline-none focus:border-b-2"
          >
            <option value="">Select a topic</option>
            {contactSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Order Number"
          type="text"
          name="orderNumber"
          placeholder="Optional"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="type-label-uppercase text-on-surface">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          disabled={isPending}
          placeholder="How can we help?"
          className={cn(
            "border border-outline-variant bg-transparent p-3 text-on-surface outline-none",
            "focus:border-primary",
          )}
        />
      </div>

      {state?.error ? (
        <p className="type-body-md text-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
