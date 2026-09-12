import BookingCancelButton from "@/components/admin/BookingCancelButton";
import { getAdminBookings } from "@/lib/supabase/queries";
import { formatMoney } from "@/lib/data";
import type { BookingStatus } from "@/lib/types";

const STATUS_STYLES: Record<BookingStatus, string> = {
  deposit_pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  verification_pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  settlement_pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  confirmed: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  cancelled: "bg-midnight/5 text-midnight/50 ring-1 ring-midnight/10",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  deposit_pending: "Deposit Pending",
  verification_pending: "Verification Pending",
  settlement_pending: "Settlement Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminBookingsPage() {
  const bookings = await getAdminBookings();
  const holding = bookings.filter((b) => b.holdsVehicle);

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Bookings</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Every booking on the platform. Cancelling one releases its vehicle back to other
        customers — it is the only way to free a car that is being held.
      </p>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">No bookings yet.</p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-midnight/60">
            {holding.length} currently holding a vehicle · {bookings.length} total
          </p>

          <div className="mt-4 space-y-4">
            {bookings.map((b) => (
              <article key={b.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-midnight">{b.bookingRef}</h2>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                      {b.holdsVehicle && (
                        <span className="inline-flex items-center rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold-dark ring-1 ring-gold/30">
                          Holding vehicle
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-midnight/70">
                      {b.customerName ?? "Unknown customer"} · {b.vehicleLabel}{" "}
                      <span className="text-midnight/40">({b.licensePlate})</span>
                    </p>
                    <p className="mt-0.5 text-sm text-midnight/60">
                      {formatDate(b.startDate)} – {formatDate(b.endDate)} ·{" "}
                      {formatMoney(b.totalAmount, b.currency)}
                    </p>
                  </div>

                  {b.status !== "cancelled" && (
                    <BookingCancelButton id={b.id} bookingRef={b.bookingRef} holdsVehicle={b.holdsVehicle} />
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
