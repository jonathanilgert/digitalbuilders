import { faqs } from "@/lib/content";

export function Faq() {
  return (
    <div className="mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface/40">
      {faqs.map((item) => (
        <details key={item.q} className="group px-5 sm:px-7">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-medium text-fg marker:hidden [&::-webkit-details-marker]:hidden">
            {item.q}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-accent transition-transform duration-300 group-open:rotate-45">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <p className="pb-5 pr-10 text-sm leading-relaxed text-fg-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
