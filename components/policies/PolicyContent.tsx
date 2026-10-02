import Link from "next/link";
import { contactDetails } from "@/data/contact";
import type { PolicyDocument } from "@/data/policies";

const policyLinks = [
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

type PolicyContentProps = {
  policy: PolicyDocument;
  currentHref: string;
};

export function PolicyContent({ policy, currentHref }: PolicyContentProps) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)] lg:gap-16">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          Policies
        </p>
        <nav aria-label="Policies" className="mt-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 lg:flex-col">
            {policyLinks.map((link) => {
              const isActive = link.href === currentHref;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "font-body text-base font-semibold text-on-surface"
                        : "font-body text-base text-on-surface-variant hover:text-on-surface"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <article className="max-w-3xl">
        <p className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
          {policy.eyebrow}
        </p>
        <h1 className="font-headline text-[2rem] font-extrabold leading-tight uppercase md:text-5xl md:tracking-tight mt-3 text-on-surface">
          {policy.title}
        </h1>
        <p className="font-body text-sm leading-normal mt-3 text-on-surface-variant">
          Last updated: {policy.lastUpdated}
        </p>

        <div className="mt-8 space-y-4">
          {policy.intro.map((paragraph) => (
            <p
              key={paragraph}
              className="font-body text-base leading-relaxed text-on-surface-variant"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-10 space-y-10 border-t border-outline-variant pt-10">
          {policy.sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="font-body text-base leading-relaxed mt-4 text-on-surface-variant"
                >
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ListTag
                  ordered={section.ordered}
                  className={`font-body text-base leading-relaxed mt-4 space-y-2 pl-6 text-on-surface-variant ${
                    section.ordered ? "list-[lower-alpha]" : "list-disc"
                  }`}
                >
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ListTag>
              )}
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:p-8">
          <h2 className="font-headline text-lg font-bold leading-tight md:text-2xl text-on-surface">
            Questions?
          </h2>
          <p className="font-body text-base leading-normal mt-2 text-on-surface-variant">
            Reach our customer care team using the details below or through our{" "}
            <Link href="/contact" className="underline hover:text-on-surface">
              contact page
            </Link>
            .
          </p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            {contactDetails.map((detail) => (
              <div key={detail.label}>
                <dt className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-on-surface-variant">
                  {detail.label}
                </dt>
                <dd className="font-body text-base leading-normal mt-2 text-on-surface">
                  {detail.href ? (
                    <Link
                      href={detail.href}
                      className="hover:text-on-surface-variant"
                    >
                      {detail.value}
                    </Link>
                  ) : (
                    detail.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </div>
  );
}

function ListTag({
  ordered,
  className,
  children,
}: {
  ordered?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return ordered ? (
    <ol className={className}>{children}</ol>
  ) : (
    <ul className={className}>{children}</ul>
  );
}
