import { Container, Eyebrow } from "@/components/ui";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <section className="bg-aurora relative overflow-hidden pt-36 pb-14 sm:pt-44 sm:pb-20">
      <Container>
        <div className="max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">{intro}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
