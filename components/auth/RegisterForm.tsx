"use client";

import { useActionState } from "react";
import {
  registerUser,
  type RegisterState,
} from "@/app/register/actions";
import { Button, Input } from "@/components/ui";

const initialState: RegisterState | null = null;

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerUser,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Input
        label="Full Name"
        type="text"
        name="fullName"
        autoComplete="name"
        required
        disabled={isPending}
      />
      <Input
        label="Email Address"
        type="email"
        name="email"
        autoComplete="email"
        required
        disabled={isPending}
      />
      <Input
        label="Phone Number"
        type="tel"
        name="phone"
        autoComplete="tel"
        required
        disabled={isPending}
      />
      <Input
        label="Delivery Address"
        type="text"
        name="deliveryAddress"
        autoComplete="street-address"
        required
        disabled={isPending}
      />
      <Input
        label="City / Location"
        type="text"
        name="city"
        autoComplete="address-level2"
        required
        disabled={isPending}
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        minLength={8}
        required
        disabled={isPending}
      />
      <Input
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        minLength={8}
        required
        disabled={isPending}
      />

      {state?.error ? (
        <p className="font-body text-base leading-normal text-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="mt-2 w-full" disabled={isPending}>
        {isPending ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
