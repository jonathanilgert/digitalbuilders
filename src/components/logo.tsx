import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-baseline ${className}`}
      aria-label="Digital Builders home"
    >
      <span className="font-display text-xl font-semibold tracking-tight text-fg">
        Digital <span className="text-accent">Builders</span>
        <span className="ml-0.5 inline-block -translate-y-1.5 text-xl font-bold leading-none text-fg-muted">
          ®
        </span>
      </span>
    </Link>
  );
}
