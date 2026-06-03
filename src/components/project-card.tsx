import Link from "next/link";
import { ArrowRight } from "@/components/ui";
import type { Project } from "@/lib/content";

function CardInner({ p, hasLink }: { p: Project; hasLink: boolean }) {
  return (
    <>
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-surface-2">
        {p.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.cover}
            alt={`${p.name} project preview`}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(34rem 24rem at 75% 10%, rgba(29,78,216,0.18), transparent 60%), radial-gradient(30rem 22rem at 15% 100%, rgba(37,99,235,0.14), transparent 60%)",
            }}
          >
            <span className="flex h-full items-center justify-center font-display text-5xl font-bold text-fg/10">
              {p.name}
            </span>
          </div>
        )}
        {hasLink && (
          <span className="absolute left-4 top-4 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs font-medium text-accent backdrop-blur">
            Case study
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 p-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-accent-soft">
            {p.type} · {p.year}
          </span>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-fg">{p.name}</h2>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line transition-all ${
            hasLink
              ? "text-fg group-hover:border-accent group-hover:bg-accent group-hover:text-ink"
              : "text-fg-subtle"
          }`}
        >
          <ArrowRight className="-rotate-45" />
        </span>
      </div>
    </>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const hasLink = Boolean(project.caseStudy && project.slug);

  if (hasLink) {
    return (
      <Link
        href={`/work/${project.slug}`}
        className="card card-hover group flex flex-col overflow-hidden"
      >
        <CardInner p={project} hasLink />
      </Link>
    );
  }

  return (
    <div className="card group flex flex-col overflow-hidden">
      <CardInner p={project} hasLink={false} />
    </div>
  );
}
