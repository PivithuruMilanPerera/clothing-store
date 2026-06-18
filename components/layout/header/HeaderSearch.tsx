"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "@/components/icons";
import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";

type HeaderSearchProps = {
  isTransparent?: boolean;
};

export function HeaderSearch({ isTransparent = false }: HeaderSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = inputRef.current?.value.trim();

    if (!query) {
      return;
    }

    router.push(`/shop?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close search" : "Search"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="hover:opacity-70"
      >
        {isOpen ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <SearchIcon className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute inset-x-0 top-full border-b border-outline-variant bg-surface-container-lowest",
            isTransparent && "shadow-md",
          )}
        >
          <Container className="py-4 md:py-5">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 border border-outline-variant bg-surface-container-lowest px-4 py-3 md:px-5"
            >
              <SearchIcon
                className="h-5 w-5 shrink-0 text-on-surface-variant"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="search"
                name="q"
                placeholder="Search products..."
                autoComplete="off"
                className="type-body-md min-w-0 flex-1 bg-transparent text-on-surface outline-none placeholder:text-on-surface-variant"
              />
              <button
                type="submit"
                className="type-label-uppercase shrink-0 text-primary hover:opacity-70"
              >
                Search
              </button>
            </form>
          </Container>
        </div>
      )}
    </>
  );
}
