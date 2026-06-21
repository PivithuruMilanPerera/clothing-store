import { Container } from "@/components/ui";

export function CodBannerSection() {
  return (
    <section className="section-py bg-surface-container-lowest">
      <Container>
        <div className="bg-primary px-6 py-8 text-center md:px-12 md:py-10">
          <h2 className="font-headline text-[1.625rem] font-extrabold leading-tight tracking-tight uppercase sm:text-[2rem] md:text-5xl text-on-primary uppercase">
            Islandwide Cash on Delivery
          </h2>
          <p className="text-on-primary/75 font-light pt-2">
            Available across the island
          </p>
        </div>
      </Container>
    </section>
  );
}
