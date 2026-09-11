"use client";

export const businessDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const field = "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-fg placeholder:text-fg-subtle";

export function HoursGrid({ data, onChange, allowClosedToggle = false }: { data: Record<string, unknown>; onChange: (key: string, value: unknown) => void; allowClosedToggle?: boolean }) {
  return <div className="space-y-3" aria-label="Hours of operation">{businessDays.map((day) => {
    const closed = Boolean(data[`${day}_closed`]);
    return <div key={day} className={`grid gap-2 ${allowClosedToggle ? "sm:grid-cols-[1fr_1fr_1fr_auto]" : "sm:grid-cols-[1fr_1fr_1fr]"} sm:items-center`}>
      <span className="text-sm text-fg-muted">{day}</span>
      <input aria-label={`${day} opening time`} disabled={closed} className={field} placeholder="Open" value={String(data[`${day}_open`] ?? "")} onChange={(event) => onChange(`${day}_open`, event.target.value)} />
      <input aria-label={`${day} closing time`} disabled={closed} className={field} placeholder="Close / closed" value={String(data[`${day}_close`] ?? "")} onChange={(event) => onChange(`${day}_close`, event.target.value)} />
      {allowClosedToggle && <label className="whitespace-nowrap text-sm text-fg-muted"><input type="checkbox" checked={closed} onChange={(event) => onChange(`${day}_closed`, event.target.checked)} /> Closed</label>}
    </div>;
  })}</div>;
}
