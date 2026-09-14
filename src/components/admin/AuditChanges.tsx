// Columns that would put personal data or a secret into a log that staff can
// read. The trigger stores the whole diff; this decides what is shown.
const REDACTED_FIELDS = new Set([
  "secret_sha256",
  "id_number",
  "id_number_normalized",
  "file_url",
  "photo_paths",
  "agreement_signed_name",
]);

// Money and rates read very differently from raw numbers.
const RATE_FIELDS = new Set([
  "weekly_discount",
  "monthly_discount",
  "reservation_deposit_rate",
  "security_deposit_rate",
]);

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (REDACTED_FIELDS.has(field)) return "(hidden)";

  if (RATE_FIELDS.has(field) && typeof value === "number") {
    return `${Math.round(value * 1000) / 10}%`;
  }

  if (typeof value === "object") {
    const text = JSON.stringify(value);
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  }

  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function humanField(field: string): string {
  return field.replace(/_/g, " ");
}

export default function AuditChanges({
  changes,
}: {
  changes: Record<string, { from: unknown; to: unknown }>;
}) {
  const fields = Object.keys(changes);

  if (fields.length === 0) {
    return <span className="text-xs text-midnight/40">No field changes recorded.</span>;
  }

  return (
    <ul className="space-y-1">
      {fields.map((field) => (
        <li key={field} className="text-xs">
          <span className="font-medium text-midnight/70">{humanField(field)}</span>{" "}
          <span className="text-midnight/40 line-through">
            {formatValue(field, changes[field].from)}
          </span>{" "}
          <span className="text-midnight/40">→</span>{" "}
          <span className="text-midnight">{formatValue(field, changes[field].to)}</span>
        </li>
      ))}
    </ul>
  );
}
