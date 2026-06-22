export default function AdminPage() {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
      <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">Welcome</h2>
      <p className="font-body text-base leading-normal mt-4 text-on-surface-variant">
        You are signed in to the admin area. Manage homepage hero banners and
        brand logos from the Banner & Logo page, or add more admin tools under{" "}
        <code className="text-on-surface">/admin</code> when you are ready.
      </p>
    </section>
  );
}
