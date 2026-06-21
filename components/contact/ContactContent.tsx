import Link from "next/link";
import { ContactForm } from "./ContactForm";
import { contactDetails, contactIntro } from "@/data/contact";

export function ContactContent() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:gap-16">
      <aside className="space-y-8">
        <div>
          <h1 className="type-headline-lg-mobile md:type-headline-lg text-on-surface">
            {contactIntro.title}
          </h1>
          <p className="type-body-md mt-4 text-on-surface-variant">
            {contactIntro.description}
          </p>
        </div>

        <dl className="space-y-6">
          {contactDetails.map((detail) => (
            <div key={detail.label}>
              <dt className="type-label-uppercase text-on-surface-variant">
                {detail.label}
              </dt>
              <dd className="type-body-md mt-2 text-on-surface">
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
      </aside>

      <section className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
        <h2 className="type-headline-md text-on-surface">Send a Message</h2>
        <p className="type-body-md mt-2 text-on-surface-variant">
          Include your order number if your question is about a purchase.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
