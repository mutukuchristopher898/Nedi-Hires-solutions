import Link from "next/link";
import {
  getContactMessages,
  getFleetCounts,
  getPendingDocumentCount,
  getVehicleDocumentAlerts,
} from "@/lib/supabase/queries";

export default async function AdminOverviewPage() {
  const [pendingDocs, messages, fleet, vehicleDocs] = await Promise.all([
    getPendingDocumentCount(),
    getContactMessages(),
    getFleetCounts(),
    getVehicleDocumentAlerts(),
  ]);
  const newMessages = messages.filter((m) => m.status === "new").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Admin Console</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Audit vehicle submissions, verify document queues, and maintain system visibility.
      </p>

      {/* Above the counts, not among them. An expired insurance certificate
          means a vehicle is bookable today that should not be, which is a
          different kind of fact from "four things are pending". */}
      {vehicleDocs.expired.length > 0 && (
        <div className="mt-6 rounded-md bg-red-500/5 px-4 py-3 ring-1 ring-red-500/20">
          <p className="text-sm font-semibold text-red-600">
            {vehicleDocs.expired.length} vehicle document
            {vehicleDocs.expired.length === 1 ? " has" : "s have"} expired
          </p>
          <ul className="mt-1.5 space-y-0.5 text-sm text-midnight/70">
            {vehicleDocs.expired.slice(0, 5).map((d) => (
              <li key={d.id}>
                <Link href={`/admin/vehicles/${d.vehicleId}`} className="hover:text-gold-dark">
                  {d.vehicleLabel} ({d.licensePlate}) — {d.docType}
                </Link>
              </li>
            ))}
          </ul>
          {vehicleDocs.expired.length > 5 && (
            <p className="mt-1 text-xs text-midnight/50">
              and {vehicleDocs.expired.length - 5} more
            </p>
          )}
        </div>
      )}

      {vehicleDocs.expiring.length > 0 && (
        <div className="mt-4 rounded-md bg-amber/10 px-4 py-3">
          <p className="text-sm text-amber">
            <strong>{vehicleDocs.expiring.length}</strong> vehicle document
            {vehicleDocs.expiring.length === 1 ? "" : "s"} expire
            {vehicleDocs.expiring.length === 1 ? "s" : ""} within 30 days:{" "}
            {vehicleDocs.expiring.slice(0, 4).map((d) => d.licensePlate).join(", ")}
            {vehicleDocs.expiring.length > 4 ? "…" : ""}
          </p>
        </div>
      )}

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-midnight/50">Live</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Card label="Documents Pending Review" value={pendingDocs} accent="text-amber" href="/admin/documents" />
        <Card label="New Contact Enquiries" value={newMessages} accent="text-amber" href="/admin/messages" />
        <Card label="Vehicle Documents Pending" value={vehicleDocs.pending.length} accent="text-amber" href="/admin/vehicles?status=pending" />
      </div>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-midnight/50">Fleet</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Real partner inventory. The {fleet.demoVehicles} illustrative rows still in the table are
        excluded from these figures.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Live Vehicles" value={fleet.liveVehicles} />
        <Card label="Units Pending Approval" value={fleet.pendingVehicles} accent="text-amber" href="/admin/approvals" />
        <Card label="Partners Pending" value={fleet.pendingPartners} accent="text-amber" />
        <Card label="Rejected" value={fleet.rejectedVehicles} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="font-semibold text-midnight">Identity Verification</h2>
          <p className="mt-1 text-sm text-midnight/60">
            Validate customer-submitted passports, driver&apos;s licenses, and national IDs. Every
            document here was uploaded by a real customer during checkout.
          </p>
          <Link href="/admin/documents" className="mt-4 inline-block text-sm font-semibold text-gold hover:text-gold-dark">
            Review documents →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="font-semibold text-midnight">Contact Enquiries</h2>
          <p className="mt-1 text-sm text-midnight/60">
            Messages from the contact form. No automated reply is sent, so these need a response
            by email or WhatsApp.
          </p>
          <Link href="/admin/messages" className="mt-4 inline-block text-sm font-semibold text-gold hover:text-gold-dark">
            Read enquiries →
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
      <div className={`mt-1 text-2xl font-bold tabular-nums ${accent ?? "text-midnight"}`}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
