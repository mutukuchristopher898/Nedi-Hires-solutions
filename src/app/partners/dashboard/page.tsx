import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/supabase/authz";
import { getMyPartnerAccount, getMyPartnerVehicles } from "@/lib/supabase/queries";
import { formatMoney } from "@/lib/data";
import { publicVehiclePhotoUrl } from "@/lib/supabase/vehiclePhotos";
import type { ApprovalStatus } from "@/lib/types";

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  approved: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
};

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pending review",
  approved: "Live",
  rejected: "Rejected",
};

export default async function PartnerDashboardPage() {
  await requireRole(["partner", "admin"], "/partners/dashboard");

  const partner = await getMyPartnerAccount();

  // An admin without a partner account of their own, or a partner whose row
  // vanished. Either way there is nothing to show but the way in.
  if (!partner) {
    return (
      <div className="container-shell max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold text-midnight">Partner Dashboard</h1>
        <p className="mt-2 text-sm text-midnight/60">
          You don&apos;t have a partner account yet. Register your business to list your first
          vehicle.
        </p>
        <Link
          href="/partners/onboarding"
          className="mt-6 inline-block rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
        >
          Register as a Partner
        </Link>
      </div>
    );
  }

  const vehicles = await getMyPartnerVehicles(partner.id);
  const live = vehicles.filter((v) => v.approvalStatus === "approved").length;
  const pending = vehicles.filter((v) => v.approvalStatus === "pending").length;
  const rejected = vehicles.filter((v) => v.approvalStatus === "rejected").length;

  return (
    <div className="container-shell py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-midnight">{partner.businessName}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-midnight/60">
            Partner account
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[partner.status]}`}>
              {partner.status === "approved" ? "Approved" : STATUS_LABELS[partner.status]}
            </span>
          </p>
        </div>
        <Link
          href="/partners/onboarding"
          className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
        >
          List another vehicle
        </Link>
      </div>

      {partner.status === "pending" && (
        <p className="mt-6 rounded-md bg-amber/10 px-4 py-3 text-sm text-amber">
          Your business is still being reviewed. You can list vehicles now — they go live once
          both your account and the vehicle are approved.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Live" value={live} accent="text-emerald-dark" />
        <Stat label="Pending review" value={pending} accent="text-amber" />
        <Stat label="Rejected" value={rejected} accent="text-red-600" />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-midnight">Your vehicles</h2>

      {vehicles.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">
            You haven&apos;t listed a vehicle yet.
          </p>
          <Link
            href="/partners/onboarding"
            className="mt-4 inline-block text-sm font-semibold text-gold-dark hover:text-gold"
          >
            List your first vehicle →
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {vehicles.map((v) => (
            <article key={v.id} className="flex flex-wrap gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
              {v.photoPaths.length > 0 ? (
                <Image
                  src={publicVehiclePhotoUrl(v.photoPaths[0])}
                  alt=""
                  width={128}
                  height={96}
                  className="h-24 w-32 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-midnight/5 text-xs text-midnight/40">
                  No photo
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-midnight">
                    {v.make} {v.model} {v.year}
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[v.approvalStatus]}`}>
                    {STATUS_LABELS[v.approvalStatus]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-midnight/60">
                  {v.licensePlate} · {v.classification} · {v.transmission} · {v.location}
                </p>
                <p className="mt-1 text-sm font-medium text-midnight">
                  {formatMoney(v.pricePerDay, v.currency)} / day
                </p>
                {v.approvalStatus === "pending" && v.photoPaths.length === 0 && (
                  <p className="mt-2 text-xs text-amber">
                    This vehicle needs at least one photograph before it can be approved.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <p className="text-sm text-midnight/60">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
