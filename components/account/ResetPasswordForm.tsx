"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  updatePassword,
  type ActionState,
} from "@/app/account/actions";
import { Button, Input } from "@/components/ui";

const initialState: ActionState | null = null;

type ResetPasswordFormProps = {
  showEmailReset?: boolean;
};

export function ResetPasswordForm({
  showEmailReset = true,
}: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState,
  );
  const [emailState, emailAction, emailPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
        <Input
          label="New Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
        />
        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
        />

        {state?.error ? (
          <p
            className="font-body text-base leading-normal text-error"
            role="alert"
          >
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

        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Password"}
        </Button>
      </form>

      {showEmailReset ? (
        <div className="border-t border-outline-variant pt-6">
          <p className="font-body text-base leading-normal text-on-surface-variant">
            Prefer to reset via email? We will send a link to your registered
            address.
          </p>

          <form action={emailAction} className="mt-4">
            {emailState?.error ? (
              <p
                className="font-body text-base leading-normal mb-4 text-error"
                role="alert"
              >
                {emailState.error}
              </p>
            ) : null}

            {emailState?.success ? (
              <p
                className="font-body text-base leading-normal mb-4 text-on-surface"
                role="status"
              >
                {emailState.success}
              </p>
            ) : null}

            <Button type="submit" variant="ghost" disabled={emailPending}>
              {emailPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
