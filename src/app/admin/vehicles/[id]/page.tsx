import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import VehicleForm from "@/components/admin/VehicleForm";
import VehicleLifecycleActions from "@/components/admin/VehicleLifecycleActions";
import VehicleDeleteButton from "@/components/admin/VehicleDeleteButton";
import AuditChanges from "@/components/admin/AuditChanges";
import { requireRole } from "@/lib/supabase/authz";
import { publicVehiclePhotoUrl } from "@/lib/supabase/vehiclePhotos";
import { formatMoney } from "@/lib/data";
import {
  getAdminVehicleById,
  getPartnerOptions,
  getAuditLog,
  getOptions,
  type VehicleLifecycle,
} from "@/lib/supabase/queries";

const LIFECYCLE_STYLES: Record<VehicleLifecycle, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  live: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  hidden: "bg-midnight/5 text-midnight/60 ring-1 ring-midnight/10",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
  archived: "bg-midnight/5 text-midnight/40 ring-1 ring-midnight/10",
};

const PARTNER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  approved: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { role } = await requireRole(["staff", "admin"], "/admin/vehicles");
  const { id } = await params;

  const [vehicle, partners, featureOptions, locationOptions, rejectionReasons] = await Promise.all([
    getAdminVehicleById(id),
    getPartnerOptions(),
    getOptions("vehicle_feature"),
    getOptions("pickup_location"),
    getOptions("vehicle_rejection_reason"),
  ]);
  if (!vehicle) notFound();

  // Recent activity for this record, which is the question an operator
  // actually has when something looks wrong: who last touched it.
  const { entries } = await getAuditLog({ entityType: "vehicles", entityId: id, limit: 10 });

  return (
    <div>
      <Link href="/admin/vehicles" className="text-sm text-midnight/60 hover:text-gold">
        ← Back to vehicles
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-midnight">
            {vehicle.make} {vehicle.model} {vehicle.year}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-midnight/60">{vehicle.licensePlate}</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${LIFECYCLE_STYLES[vehicle.lifecycle]}`}
            >
              {vehicle.lifecycle}
            </span>
            {vehicle.isDemo && (
              <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
                illustrative
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-midnight/40">
            Submitted {formatWhen(vehicle.createdAt)}
          </p>
        </div>

        <VehicleLifecycleActions
          id={vehicle.id}
          label={`${vehicle.make} ${vehicle.model}`}
          lifecycle={vehicle.lifecycle}
          hasPhoto={vehicle.photoPaths.length > 0}
          canManage={role === "admin"}
          rejectionReasons={rejectionReasons}
        />
      </div>

      {vehicle.archivedAt && (
        <p className="mt-4 rounded-md bg-midnight/5 px-4 py-3 text-sm text-midnight/60">
          Archived on {formatWhen(vehicle.archivedAt)}. It is out of the fleet and not bookable;
          past bookings that reference it are unaffected.
        </p>
      )}
      {vehicle.rejectionReason && (
        <p className="mt-4 rounded-md bg-red-500/5 px-4 py-3 text-sm text-red-600">
          Rejected: {vehicle.rejectionReason}
        </p>
      )}
      {vehicle.lifecycle === "pending" && vehicle.photoPaths.length === 0 && (
        <p className="mt-4 rounded-md bg-amber/10 px-4 py-3 text-sm text-amber">
          This submission has no photographs. Approval is refused without at least one, so the
          partner needs to be asked for pictures before this can go live.
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-midnight">Photographs</h2>
        {vehicle.photoPaths.length === 0 ? (
          <p className="mt-2 text-sm text-midnight/50">None uploaded.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {vehicle.photoPaths.map((path) => (
              <a
                key={path}
                href={publicVehiclePhotoUrl(path)}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-xl ring-1 ring-line"
              >
                <Image
                  src={publicVehiclePhotoUrl(path)}
                  alt=""
                  width={400}
                  height={300}
                  className="aspect-[4/3] w-full object-cover transition group-hover:opacity-90"
                />
              </a>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-midnight">Specification</h2>
          <dl className="mt-3 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
            <Detail label="Class" value={vehicle.classification} />
            <Detail label="Transmission" value={vehicle.transmission} />
            <Detail label="Fuel" value={vehicle.fuelType} />
            <Detail label="Seats" value={String(vehicle.capacity)} />
            <Detail label="Based at" value={vehicle.location} />
            <Detail
              label="Daily rate"
              value={formatMoney(vehicle.pricePerDay, vehicle.currency)}
            />
          </dl>

          {vehicle.features.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-midnight">Features</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {vehicle.features.map((f) => (
                  <li
                    key={f}
                    className="rounded-full bg-midnight/5 px-2.5 py-1 text-xs text-midnight/70"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {vehicle.description && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-midnight">Description</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-midnight/70">
                {vehicle.description}
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-midnight">Who is offering it</h2>
          {vehicle.partner ? (
            <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-line">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-midnight">{vehicle.partner.businessName}</p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    PARTNER_STATUS_STYLES[vehicle.partner.status] ?? PARTNER_STATUS_STYLES.pending
                  }`}
                >
                  partner {vehicle.partner.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-midnight/60">
                {vehicle.partner.businessEmail ?? (
                  <span className="text-midnight/40">no email on file</span>
                )}
              </p>

              {/* Approving a car from a business that was never approved
                  itself is the mistake this warning exists to stop. */}
              {vehicle.partner.status !== "approved" && (
                <p className="mt-3 rounded-md bg-amber/10 px-3 py-2 text-xs text-amber">
                  This business has not been approved as a partner. Deal with the business first —
                  approving its vehicles puts a car on the site from an operator you have not
                  vetted.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                <Link
                  href={`/admin/accounts/${vehicle.partner.ownerProfileId}`}
                  className="text-gold-dark hover:text-gold"
                >
                  Account holder →
                </Link>
                <Link href="/admin/approvals" className="text-gold-dark hover:text-gold">
                  Partner approvals →
                </Link>
              </div>

              <div className="mt-4 border-t border-line pt-3">
                <h3 className="text-sm font-semibold text-midnight">Business paperwork</h3>
                <p className="mt-1 text-xs text-midnight/50">
                  Collected when the business registered, not per vehicle.
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <PaperworkLink label="Tax credential" url={vehicle.partner.taxCredentialUrl} />
                  <PaperworkLink label="Owner ID" url={vehicle.partner.idDocumentUrl} />
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-midnight/60 ring-1 ring-line">
              No partner — this vehicle was added directly from the admin screens rather than
              submitted by a business.
            </p>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-midnight">Edit details</h2>
        <VehicleForm
          vehicle={vehicle}
          partners={partners}
          featureOptions={featureOptions}
          locationOptions={locationOptions}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-midnight">Recent activity</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-midnight/50">No staff changes recorded for this vehicle.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-white p-3 ring-1 ring-line">
                <p className="text-xs text-midnight/60">
                  {entry.actorEmail ?? "Unknown"} · {entry.action} · {formatWhen(entry.createdAt)}
                </p>
                <div className="mt-2">
                  <AuditChanges changes={entry.changes} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-midnight">Danger zone</h2>
        <div className="mt-3">
          <VehicleDeleteButton
            id={vehicle.id}
            label={vehicle.licensePlate}
            bookingCount={vehicle.bookingCount}
            photoPaths={vehicle.photoPaths}
            canManage={role === "admin"}
          />
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="text-sm text-midnight/60">{label}</dt>
      <dd className="text-sm font-medium capitalize text-midnight">{value}</dd>
    </div>
  );
}

function PaperworkLink({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <li className="text-midnight/40">
        {label}: <span className="text-xs">not supplied</span>
      </li>
    );
  }

  return (
    <li>
      <span className="text-midnight/60">{label}: </span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-gold-dark hover:text-gold"
      >
        Open →
      </a>
    </li>
  );
}
