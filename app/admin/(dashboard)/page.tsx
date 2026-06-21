export default function AdminPage() {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
      <h2 className="type-headline-md text-on-surface">Welcome</h2>
      <p className="type-body-md mt-4 text-on-surface-variant">
        You are signed in to the admin area. Add product, order, and customer
        management pages under <code className="text-on-surface">/admin</code>{" "}
        when you are ready.
      </p>
    </section>
  );
}
