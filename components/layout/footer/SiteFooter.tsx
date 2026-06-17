import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";
import { Container } from "@/components/ui";
import { footerColumns } from "@/data/landing";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-on-primary">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Velvorz home">
              <Image
                src={logo}
                alt="Velvorz"
                height={36}
                className="h-9 w-auto object-contain brightness-0 invert md:h-11"
              />
            </Link>
            <p className="type-body-md mt-4 text-inverse-primary">
              © 2024 VELVORZ. ARCHITECTURAL PRECISION.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="type-label-uppercase mb-4">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="type-body-md text-inverse-primary hover:text-on-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </footer>
  );
}
