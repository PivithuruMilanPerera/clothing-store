import { Container } from "@/components/ui";

export default function ProductLoading() {
  return (
    <main className="bg-surface-container-lowest pt-4 pb-10 md:pt-6 md:pb-14">
      <Container>
        <div
          aria-busy="true"
          aria-live="polite"
          className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16"
        >
          <div className="flex flex-col gap-3">
            <div className="aspect-square animate-pulse bg-surface-container-low" />
            <div className="flex gap-2">
              <div className="h-16 w-16 animate-pulse bg-surface-container-low sm:h-[4.5rem] sm:w-[4.5rem]" />
              <div className="h-16 w-16 animate-pulse bg-surface-container-low sm:h-[4.5rem] sm:w-[4.5rem]" />
              <div className="h-16 w-16 animate-pulse bg-surface-container-low sm:h-[4.5rem] sm:w-[4.5rem]" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="h-10 w-4/5 animate-pulse bg-surface-container-low md:h-14" />
            <div className="mt-4 h-6 w-28 animate-pulse bg-surface-container-low" />
            <div className="mt-3 h-4 w-40 animate-pulse bg-surface-container-low" />

            <div className="mt-8 border-t border-outline-variant pt-8">
              <div className="h-3 w-24 animate-pulse bg-surface-container-low" />
              <div className="mt-3 flex gap-2.5">
                <div className="h-9 w-9 animate-pulse rounded-full bg-surface-container-low" />
                <div className="h-9 w-9 animate-pulse rounded-full bg-surface-container-low" />
                <div className="h-9 w-9 animate-pulse rounded-full bg-surface-container-low" />
              </div>
            </div>

            <div className="mt-8">
              <div className="h-3 w-20 animate-pulse bg-surface-container-low" />
              <div className="mt-3 flex gap-2">
                <div className="h-11 w-14 animate-pulse bg-surface-container-low" />
                <div className="h-11 w-14 animate-pulse bg-surface-container-low" />
                <div className="h-11 w-14 animate-pulse bg-surface-container-low" />
                <div className="h-11 w-14 animate-pulse bg-surface-container-low" />
              </div>
            </div>

            <div className="mt-8 h-12 w-full animate-pulse bg-surface-container-low" />
            <div className="mt-6 h-4 w-full animate-pulse bg-surface-container-low" />
            <div className="mt-2 h-4 w-5/6 animate-pulse bg-surface-container-low" />
          </div>
        </div>
        <span className="sr-only">Loading product details</span>
      </Container>
    </main>
  );
}
