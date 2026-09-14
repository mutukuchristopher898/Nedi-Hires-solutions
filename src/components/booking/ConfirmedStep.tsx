"use client";

import Link from "next/link";
import type { TripDetails } from "@/lib/types";

export default function ConfirmedStep({ bookingRef, trip }: { bookingRef: string | null; trip: TripDetails }) {
  return (
    <section className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10 text-2xl text-emerald-dark">
        ✓
      </div>
      <h2 className="mt-4 text-xl font-semibold text-midnight">
        <span className="italic text-gold-dark">Twende.</span> You&apos;re booked.
      </h2>
      {/* No longer claims a confirmation email was sent. None is: there is no
          sending domain yet, so the promise was simply untrue. The booking
          reference and the account page are what the customer actually has. */}
      <p className="mt-1 text-sm text-midnight/60">
        Reference <span className="font-mono font-medium text-midnight">{bookingRef}</span>. Keep
        it — it&apos;s how we find your booking. Pickup details are on your bookings page, and our
        WhatsApp number is in the footer for anything that comes up.
      </p>
      <p className="mt-3 text-sm text-midnight/60">
        {trip.driveType === "self_drive" ? "Self-drive" : "Chauffeur-driven"} ·{" "}
        {trip.purpose === "personal" ? "Personal" : "Commercial"} · Pickup at {trip.pickupPoint} ·
        Heading to {trip.destination}
        {trip.returnToDifferentLocation && <> · Returning to {trip.dropoffPoint}</>}
      </p>
      <Link
        href="/account"
        className="mt-6 inline-block rounded-md bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal"
      >
        View My Bookings
      </Link>
    </section>
  );
}
