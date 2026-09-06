// Site-wide form field styling, used by every form outside the booking
// wizard (which has its own copy in components/booking/shared.tsx).
//
// Invalid fields are deliberately indicated with a coloured border only — no
// written explanation beside the field, which is the look the site was
// designed around. That choice is kept exactly as-is visually. What it can't
// be allowed to mean is that a screen-reader or colour-blind user gets no
// explanation at all, so the detail is carried two other ways: aria-invalid
// marks the field itself, and FormError announces the specific problems in
// visually-hidden text alongside the summary everyone sees.

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

// Spread onto an input instead of setting className by hand, so a field that
// looks invalid is also reported as invalid to assistive technology.
export function fieldProps(state?: "reject" | "warn", base: string = inputClass) {
  return {
    className: fieldClass(state, base),
    "aria-invalid": state === "reject" ? true : undefined,
  };
}

// The one visible error summary a form shows. `details` are the per-field
// messages the validators already produce — displayed to nobody, but read
// aloud, so the explanation isn't lost.
export function FormError({
  message,
  details,
  className = "",
}: {
  message: string;
  details?: Record<string, string | boolean | undefined>;
  className?: string;
}) {
  // Validators that record only `true` per field have nothing to read out;
  // the ones that record a message do, and those are the long forms where
  // "fix the highlighted fields" is least usable on its own.
  const spoken = details
    ? Object.values(details).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];

  return (
    <p
      role="alert"
      className={`rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 ${className}`.trim()}
    >
      {message}
      {spoken.length > 0 && <span className="sr-only"> {spoken.join(" ")}</span>}
    </p>
  );
}
