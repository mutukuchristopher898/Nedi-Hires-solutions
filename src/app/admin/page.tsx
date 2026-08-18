import Link from "next/link";
import { documentQueue, partnerUnits, vehicles } from "@/lib/data";

export default function AdminOverviewPage() {
  const pendingUnits = partnerUnits.filter((u) => u.status === "pending").length;
  const pendingDocs = documentQueue.filter((d) => d.status === "pending").length;
  const liveVehicles = vehicles.filter((v) => v.approvalStatus === "approved").length;
  const partnerShare = vehicles.filter((v) => v.fleetSource === "partner").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Admin Console</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Audit vehicle submissions, verify document queues, and maintain system visibility.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Live Vehicles" value={liveVehicles} />
        <Card label="Partner Share of Fleet" value={partnerShare} />
        <Card label="Units Pending Approval" value={pendingUnits} accent="text-amber" href="/admin/approvals" />
        <Card label="Documents Pending Review" value={pendingDocs} accent="text-amber" href="/admin/documents" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="font-semibold text-midnight">Unit Approval Queue</h2>
          <p className="mt-1 text-sm text-midnight/60">
            Newly uploaded partner units awaiting manual or automated checks before going live.
          </p>
          <Link href="/admin/approvals" className="mt-4 inline-block text-sm font-semibold text-gold hover:text-gold-dark">
            Review queue →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="font-semibold text-midnight">Identity Verification</h2>
          <p className="mt-1 text-sm text-midnight/60">
            Validate customer-submitted passports, driver&apos;s licenses, and national IDs.
          </p>
          <Link href="/admin/documents" className="mt-4 inline-block text-sm font-semibold text-gold hover:text-gold-dark">
            Review documents →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: number;
  accent?: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-xl bg-white p-4 ring-1 ring-line transition hover:shadow-md">
      <div className="text-xs text-midnight/50">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ?? "text-midnight"}`}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
