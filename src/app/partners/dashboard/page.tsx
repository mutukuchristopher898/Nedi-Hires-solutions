import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { partnerUnits } from "@/lib/data";

export default function PartnerDashboardPage() {
  const total = partnerUnits.length;
  const pending = partnerUnits.filter((u) => u.status === "pending").length;
  const approved = partnerUnits.filter((u) => u.status === "approved").length;
  const rejected = partnerUnits.filter((u) => u.status === "rejected").length;

  return (
    <div className="container-shell py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-midnight">Partner Dashboard</h1>
          <p className="mt-1 text-sm text-midnight/60">Rift Valley Rides · Partner since Jan 2026</p>
        </div>
        <Link
          href="/partners/onboarding"
          className="rounded-md bg-emerald px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-dark"
        >
          + Add Vehicle
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Total Units" value={total} />
        <Stat label="Pending Review" value={pending} accent="text-amber" />
        <Stat label="Approved" value={approved} accent="text-emerald-dark" />
        <Stat label="Rejected" value={rejected} accent="text-red-600" />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full text-sm">
          <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-midnight/50">
            <tr>
              <th className="px-5 py-3">Vehicle</th>
              <th className="px-5 py-3">Classification</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {partnerUnits.map((unit) => (
              <tr key={unit.id}>
                <td className="px-5 py-3 font-medium text-midnight">{unit.vehicleName}</td>
                <td className="px-5 py-3 text-midnight/70">{unit.classification}</td>
                <td className="px-5 py-3 text-midnight/70">{unit.submittedOn}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={unit.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-line">
      <div className="text-xs text-midnight/50">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ?? "text-midnight"}`}>{value}</div>
    </div>
  );
}
