import Link from "next/link";
import { getSessionAdmin, getSessionUser } from "@/lib/auth";
import { UserIcon } from "@/components/icons";

type HeaderAccountLinkProps = {
  isTransparent?: boolean;
};

export async function HeaderAccountLink(_props: HeaderAccountLinkProps) {
  const [user, admin] = await Promise.all([getSessionUser(), getSessionAdmin()]);
  const href = admin ? "/admin" : user ? "/account" : "/login";
  const label = admin ? "Admin Dashboard" : user ? "My Account" : "Sign In";

  return (
    <Link href={href} aria-label={label} className="hover:opacity-70">
      <UserIcon className="h-5 w-5" />
    </Link>
  );
}
