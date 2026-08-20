export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${bold ? "font-semibold text-midnight" : "text-midnight/70"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

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
