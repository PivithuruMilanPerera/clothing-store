import type { Metadata } from "next";
import { getProfile } from "@/app/account/actions";
import { ProfileForm } from "@/components/account";

export const metadata: Metadata = {
  title: "Profile | VELVORZ",
  description: "Update your VELVORZ profile details.",
};

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    return (
      <div>
        <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">Profile</h2>
        <p className="font-body text-base leading-normal mt-4 text-on-surface-variant">
          Unable to load your profile. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">Profile</h2>
      <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
        Update your name and contact information.
      </p>
      <div className="mt-8">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
