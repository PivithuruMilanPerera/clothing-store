import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { Container } from "@/components/ui";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  alternatePrompt: string;
  alternateHref: string;
  alternateLabel: string;
};

export function AuthLayout({
  title,
  description,
  children,
  alternatePrompt,
  alternateHref,
  alternateLabel,
}: AuthLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-5rem)] flex-col bg-background">
        <Container className="flex flex-1 items-center justify-center py-16 md:py-24">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center">
              <h1 className="font-headline text-[2rem] font-extrabold leading-tight uppercase md:text-5xl md:tracking-tight text-on-surface">
                {title}
              </h1>
              <p className="font-body text-base leading-normal mt-4 text-on-surface-variant">
                {description}
              </p>
            </div>

            {children}

            <p className="font-body text-base leading-normal mt-8 text-center text-on-surface-variant">
              {alternatePrompt}{" "}
              <Link
                href={alternateHref}
                className="font-label text-xs font-bold uppercase tracking-[0.15em] leading-none text-primary underline-offset-4 hover:underline"
              >
                {alternateLabel}
              </Link>
            </p>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
