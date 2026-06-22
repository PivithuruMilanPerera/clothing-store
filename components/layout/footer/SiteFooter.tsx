import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";
import { Container } from "@/components/ui";
import { footerColumns, navLinks } from "@/data/landing";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-on-primary text-sm leading-normal">
      <Container className="pt-16 md:pt-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Velvorz home">
              <Image
                src={logo}
                alt="Velvorz"
                height={36}
                className="h-12 w-auto object-contain brightness-0 invert md:h-14"
              />
            </Link>
            <p className="text-inverse-primary pt-3 pr-5">
              VELVORZ is a modern clothing label built around refined essentials
              oversized hoodies, structured trousers, leather sneakers, and
              pieces designed to move with you. We edit every collection with
              intention so your wardrobe stays focused, not crowded.
            </p>
          </div>

          <div>
            <h3 className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none !text-sm mb-4">
              Menu
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-inverse-primary hover:text-on-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none !text-sm mb-4">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-inverse-primary hover:text-on-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-4 text-inverse-primary text-center py-8 border-t border-on-primary/20 mt-5">
          © {year} VELVORZ. ARCHITECTURAL PRECISION.
        </p>
      </Container>
    </footer>
  );
}
