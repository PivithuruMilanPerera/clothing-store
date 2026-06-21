"use client";

import { useActionState } from "react";
import { loginUser, type LoginState } from "@/app/login/actions";
import { Button, Input } from "@/components/ui";

const initialState: LoginState | null = null;

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo = "/account" }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginUser,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="redirect" value={redirectTo} />
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
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
        <p className="font-body text-base leading-normal text-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
