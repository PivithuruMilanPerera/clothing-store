"use client";

import { useActionState } from "react";
import {
  requestPasswordResetByEmail,
  type ForgotPasswordState,
} from "@/app/login/actions";
import { Button, Input } from "@/components/ui";

const initialState: ForgotPasswordState | null = null;

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetByEmail,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        disabled={isPending}
      />

      {state?.error ? (
        <p className="font-body text-base leading-normal text-error" role="alert">
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p
          className="font-body text-base leading-normal text-on-surface"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send Reset Link"}
      </Button>
    </form>
  );
}
