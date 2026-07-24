import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders | Admin | VELVORZ",
  description: "View and manage customer orders.",
};

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          Admin
        </p>
        <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
          Orders
        </h1>
      </div>

      <section className="relative overflow-hidden rounded-sm border border-outline-variant bg-primary px-6 py-10 text-on-primary md:px-10 md:py-14">
        <div className="relative z-10 max-w-xl">
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] leading-none text-on-primary/70">
            Order Management
          </p>
          <h2 className="font-headline mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
            Coming Soon
          </h2>
          <p className="font-body mt-4 text-sm leading-relaxed text-on-primary/80 md:text-base">
            Track customer orders, update fulfillment status, and manage
            shipping details from one place.
          </p>
        </div>

        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-on-primary/10 md:h-56 md:w-56"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-10 right-12 h-28 w-28 rounded-full border border-on-primary/10 md:h-36 md:w-36"
          aria-hidden="true"
        />
      </section>
    </div>
  );
}
