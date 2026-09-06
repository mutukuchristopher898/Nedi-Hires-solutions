import Link from "next/link";
import DemoTag from "@/components/DemoTag";
import { partnerUnits, vehicles } from "@/lib/data";
import { getContactMessages, getPendingDocuments } from "@/lib/supabase/queries";

export default async function AdminOverviewPage() {
  // Real, from the database.
  const [documents, messages] = await Promise.all([getPendingDocuments(), getContactMessages()]);
  const pendingDocs = documents.filter((d) => d.status === "pending").length;
  const newMessages = messages.filter((m) => m.status === "new").length;

  // Still from the illustrative catalogue in src/lib/data.ts — no partner has
  // ever submitted a vehicle, because partner onboarding does not persist yet.
  const pendingUnits = partnerUnits.filter((u) => u.status === "pending").length;
  const liveVehicles = vehicles.filter((v) => v.approvalStatus === "approved").length;
  const partnerShare = vehicles.filter((v) => v.fleetSource === "partner").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Admin Console</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Audit vehicle submissions, verify document queues, and maintain system visibility.
      </p>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-midnight/50">Live</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Card label="Documents Pending Review" value={pendingDocs} accent="text-amber" href="/admin/documents" />
        <Card label="New Contact Enquiries" value={newMessages} accent="text-amber" href="/admin/messages" />
      </div>

      <div className="mt-8 flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-midnight/50">Fleet catalogue</h2>
        <DemoTag label="Sample Data" />
      </div>
      <p className="mt-1 text-sm text-midnight/60">
        These count the illustrative catalogue rather than live inventory, and no partner has
        submitted a vehicle yet.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Vehicles in Catalogue" value={liveVehicles} />
        <Card label="Partner Share of Catalogue" value={partnerShare} />
        <Card label="Units Pending Approval" value={pendingUnits} href="/admin/approvals" />
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
