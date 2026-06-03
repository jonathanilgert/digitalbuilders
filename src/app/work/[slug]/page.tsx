import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, Section, SectionHeading, Eyebrow, Button, ArrowRight } from "@/components/ui";
import { CtaSection } from "@/components/cta";
import { icons } from "@/components/icons";
import { projects } from "@/lib/content";

const Check = icons.check;
const withCase = projects.filter((p) => p.caseStudy && p.slug);

export function generateStaticParams() {
  return withCase.map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = withCase.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: `${project.name} — Case Study`,
    description: project.summary,
  };
}

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const project = withCase.find((p) => p.slug === slug);
  if (!project || !project.caseStudy) notFound();
  const cs = project.caseStudy;
  const gallery = cs.images.slice(1); // first image is the hero/cover

  return (
    <>
      {/* Header */}
      <section className="bg-aurora relative overflow-hidden pt-36 pb-12 sm:pt-44 sm:pb-16">
        <Container>
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-accent"
          >
            <ArrowRight className="rotate-180" />
            Back to work
          </Link>
          <div className="mt-6 max-w-3xl">
            <Eyebrow>
              {project.type} · {project.year}
            </Eyebrow>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              {project.name}
            </h1>
            {project.summary && (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
                {project.summary}
              </p>
            )}
          </div>

          {/* Meta */}
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {cs.facts.map((m) => (
              <div key={m.label} className="bg-navy px-5 py-5">
                <dt className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
                  {m.label}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-fg">
                  {m.href ? (
                    <a
                      href={m.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent transition-colors hover:text-accent-soft"
                    >
                      {m.value}
                    </a>
                  ) : (
                    m.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Cover image */}
      <Container>
        <figure className="card overflow-hidden p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cs.images[0].src}
            alt={cs.images[0].alt}
            className="w-full rounded-[0.85rem]"
            loading="eager"
          />
        </figure>
      </Container>

      {/* Overview + Approach */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading eyebrow="Overview" title="The project" intro={cs.overview} />
          <div>
            <h3 className="font-display text-xl font-semibold text-fg">
              {cs.approachTitle ?? "Our approach"}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-fg-muted">{cs.approachIntro}</p>
            <ul className="mt-6 space-y-3">
              {cs.approach.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-fg-muted">
                  <Check className="mt-0.5 text-accent [&_svg]:h-4 [&_svg]:w-4" />
                  {item}
                </li>
              ))}
            </ul>
            {cs.implementation && (
              <p className="mt-6 text-base leading-relaxed text-fg-muted">{cs.implementation}</p>
            )}
          </div>
        </div>
      </Section>

      {/* Gallery */}
      <Section className="border-y border-line bg-navy/40">
        <SectionHeading eyebrow="Gallery" title="A closer look." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {gallery.map((img) => (
            <figure key={img.src} className="card card-hover overflow-hidden p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt}
                className="w-full rounded-[0.85rem]"
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </Section>

      {/* Results + quote */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Results" title="What we shipped." intro={cs.results} />
          {cs.resultsList && (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {cs.resultsList.map((item) => (
                <li key={item} className="card flex items-start gap-3 p-5 text-sm text-fg">
                  <Check className="mt-0.5 text-accent [&_svg]:h-5 [&_svg]:w-5" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {cs.quote && (
            <blockquote className="card mt-8 p-8 sm:p-10">
              <p className="font-display text-xl font-medium leading-relaxed text-fg sm:text-2xl">
                “{cs.quote}”
              </p>
            </blockquote>
          )}
          <div className="mt-8">
            <Button href="/work" variant="secondary">
              <ArrowRight className="rotate-180" />
              All projects
            </Button>
          </div>
        </div>
      </Section>

      <CtaSection />
    </>
  );
}
