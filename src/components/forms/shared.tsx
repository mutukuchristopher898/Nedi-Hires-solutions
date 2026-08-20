// Site-wide form field styling, used by every form outside the booking
// wizard (which has its own copy in components/booking/shared.tsx). Invalid
// fields are indicated with a colored border only — no written explanation
// next to the field itself; forms show one summary message instead.

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-midnight/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  "mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none";

export function fieldClass(state?: "reject" | "warn", base: string = inputClass) {
  if (state === "reject") return `${base} border-red-500 focus:border-red-500`;
  if (state === "warn") return `${base} border-amber-500 focus:border-amber-500`;
  return base;
}
