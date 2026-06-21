"use client";

import { useActionState } from "react";
import { adminLogin, type AdminLoginState } from "@/app/admin/login/actions";
import { Button, Input } from "@/components/ui";

const initialState: AdminLoginState | null = null;

type AdminLoginFormProps = {
  redirectTo?: string;
};

export function AdminLoginForm({ redirectTo = "/admin" }: AdminLoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    adminLogin,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="redirect" value={redirectTo} />
      <Input
        label="Admin Email"
        type="email"
        name="email"
        autoComplete="username"
        required
        disabled={isPending}
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        disabled={isPending}
      />

      {state?.error ? (
        <p className="type-body-md text-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending ? "Signing In..." : "Sign In to Admin"}
      </Button>
    </form>
  );
}
