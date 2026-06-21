"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/app/account/actions";
import { Button, Input } from "@/components/ui";
import type { Profile } from "@/lib/types";

const initialState: ActionState | null = null;

type ProfileFormProps = {
  profile: Profile;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <Input
        label="Full Name"
        type="text"
        name="fullName"
        defaultValue={profile.full_name}
        autoComplete="name"
        required
        disabled={isPending}
      />
      <Input
        label="Email"
        type="email"
        name="email"
        defaultValue={profile.email}
        autoComplete="email"
        disabled
      />
      <Input
        label="Phone"
        type="tel"
        name="phone"
        defaultValue={profile.phone ?? ""}
        autoComplete="tel"
        disabled={isPending}
      />

      {state?.error ? (
        <p className="type-body-md text-error" role="alert">
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p className="type-body-md text-on-surface" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
