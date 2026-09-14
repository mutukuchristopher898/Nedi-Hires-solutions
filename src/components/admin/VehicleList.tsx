"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import VehicleLifecycleActions from "@/components/admin/VehicleLifecycleActions";
import VehicleBulkBar from "@/components/admin/VehicleBulkBar";
import { publicVehiclePhotoUrl } from "@/lib/supabase/vehiclePhotos";
import { formatMoney } from "@/lib/data";
import type { AdminVehicle, VehicleLifecycle } from "@/lib/supabase/queries";

const LIFECYCLE_STYLES: Record<VehicleLifecycle, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  live: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  hidden: "bg-midnight/5 text-midnight/60 ring-1 ring-midnight/10",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
  archived: "bg-midnight/5 text-midnight/40 ring-1 ring-midnight/10",
};

export default function VehicleList({
  vehicles,
  canManage,
  rejectionReasons,
  locations,
}: {
  vehicles: AdminVehicle[];
  canManage: boolean;
  rejectionReasons: string[];
  locations: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Selection is keyed by id and intersected with what is on screen, so a
  // filter change or a page move cannot leave rows selected that the operator
  // can no longer see — and then act on them.
  const visibleIds = vehicles.map((v) => v.id);
  const selected = vehicles.filter((v) => selectedIds.includes(v.id));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  function toggleAll() {
    setSelectedIds(allVisibleSelected ? [] : visibleIds);
  }

  return (
    <>
      <label className="mt-4 flex items-center gap-2 text-sm text-midnight/70">
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-line accent-gold"
        />
        Select all on this page
      </label>

      <div className="mt-3 space-y-3">
        {vehicles.map((v) => {
          const isSelected = selectedIds.includes(v.id);

          return (
            <article
              key={v.id}
              className={`flex flex-wrap gap-4 rounded-2xl bg-white p-4 ring-1 transition ${
                isSelected ? "ring-2 ring-gold" : "ring-line"
              }`}
            >
              <label className="flex items-start pt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(v.id)}
                  aria-label={`Select ${v.make} ${v.model} ${v.year}`}
                  className="h-4 w-4 rounded border-line accent-gold"
                />
              </label>

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
                  <Link
                    href={`/admin/vehicles/${v.id}`}
                    className="font-semibold text-midnight hover:text-gold-dark"
                  >
                    {v.make} {v.model} {v.year}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${LIFECYCLE_STYLES[v.lifecycle]}`}
                  >
                    {v.lifecycle}
                  </span>
                  {v.isDemo && (
                    <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
                      illustrative
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-midnight/60">
                  {v.licensePlate} · {v.classification} · {v.transmission} · {v.location}
                </p>
                <p className="mt-1 text-sm text-midnight/70">
                  {v.partnerName ?? <span className="text-midnight/40">No partner</span>} ·{" "}
                  <span className="font-medium text-midnight">
                    {formatMoney(v.pricePerDay, v.currency)}/day
                  </span>
                </p>
                {v.rejectionReason && (
                  <p className="mt-2 rounded-md bg-red-500/5 px-2 py-1 text-xs text-red-600">
                    Rejected: {v.rejectionReason}
                  </p>
                )}
              </div>

              <VehicleLifecycleActions
                id={v.id}
                label={`${v.make} ${v.model}`}
                lifecycle={v.lifecycle}
                hasPhoto={v.photoPaths.length > 0}
                canManage={canManage}
                rejectionReasons={rejectionReasons}
              />
            </article>
          );
        })}
      </div>

      <VehicleBulkBar
        selected={selected.map((v) => ({
          id: v.id,
          label: `${v.make} ${v.model}`,
          hasPhoto: v.photoPaths.length > 0,
        }))}
        locations={locations}
        onDone={() => setSelectedIds([])}
      />
    </>
  );
}
