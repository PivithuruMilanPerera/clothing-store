export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          Admin
        </p>
        <h1 className="font-headline mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-on-surface md:text-3xl">
          Dashboard
        </h1>
      </div>

      <section className="relative overflow-hidden rounded-sm border border-outline-variant bg-primary px-6 py-10 text-on-primary md:px-10 md:py-14">
        <div className="relative z-10 max-w-xl">
          <p className="font-label text-xs font-bold uppercase tracking-[0.2em] leading-none text-on-primary/70">
            Admin Dashboard
          </p>
          <h2 className="font-headline mt-3 text-2xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
            Coming Soon
          </h2>
          <p className="font-body mt-4 text-sm leading-relaxed text-on-primary/80 md:text-base">
            New admin tools and insights are on the way. For now, manage homepage
            hero banners and brand logos from the Banner &amp; Logo section.
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
