export type ContactDetail = {
  label: string;
  value: string;
  href?: string;
};

export const contactIntro = {
  title: "Contact Us",
  description:
    "Questions about an order, a product, or a return? Send us a message and our customer care team will get back to you shortly.",
};

export const contactDetails: ContactDetail[] = [
  {
    label: "Email",
    value: "support@velvorz.com",
    href: "mailto:support@velvorz.com",
  },
  {
    label: "Phone",
    value: "+1 (212) 555-0198",
    href: "tel:+12125550198",
  },
  {
    label: "Hours",
    value: "Mon–Fri, 9:00 AM – 6:00 PM EST",
  },
  {
    label: "Studio",
    value: "450 Mercer Street, New York, NY 10012",
  },
];

export const contactSubjects = [
  "Order Inquiry",
  "Returns & Exchanges",
  "Product Question",
  "Shipping",
  "Wholesale",
  "Other",
] as const;

export type ContactSubject = (typeof contactSubjects)[number];
