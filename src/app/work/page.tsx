import type { Metadata } from "next";
import { Section } from "@/components/ui";
import { PageHero } from "@/components/page-hero";
import { CtaSection } from "@/components/cta";
import { ProjectCard } from "@/components/project-card";
import { projects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description:
    "A portfolio of innovative design and digital projects — each reflecting our passion, creativity, and commitment to impactful results.",
};

export default function WorkPage() {
  return (
    <>
      <PageHero
        eyebrow="Our work"
        title={
          <>
            Innovative design and digital projects that{" "}
            <span className="text-gradient">elevate brands</span>.
          </>
        }
        intro="Each project reflects our passion, creativity, and commitment to delivering impactful results worldwide."
      />

      <Section className="pt-4">
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.name} project={p} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-fg-subtle">
          More case studies coming soon — get in touch to see relevant examples for your industry.
        </p>
      </Section>

      <CtaSection />
    </>
  );
}
