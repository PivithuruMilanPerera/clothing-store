import type { Metadata } from "next";
import { getAddresses } from "@/app/account/actions";
import { AddressManager } from "@/components/account";

export const metadata: Metadata = {
  title: "Addresses | VELVORZ",
  description: "Manage your saved shipping addresses.",
};

export default async function AddressesPage() {
  const addresses = await getAddresses();

  return (
    <div>
      <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">Addresses</h2>
      <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
        Save addresses for faster checkout.
      </p>
      <div className="mt-8">
        <AddressManager addresses={addresses} />
      </div>
    </div>
  );
}
