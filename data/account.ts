import type { AccountNavItem } from "@/lib/types";

export const accountNavItems: AccountNavItem[] = [
  {
    label: "Profile",
    href: "/account/profile",
    description: "Manage your personal details",
  },
  {
    label: "Addresses",
    href: "/account/addresses",
    description: "Shipping and billing addresses",
  },
  {
    label: "Order History",
    href: "/account/orders",
    description: "View past purchases",
  },
  {
    label: "Return Requests",
    href: "/account/returns",
    description: "Track and submit returns",
  },
];
