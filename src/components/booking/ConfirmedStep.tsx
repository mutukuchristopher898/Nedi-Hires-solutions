"use client";

import Link from "next/link";
import type { TripDetails } from "@/lib/types";

export default function ConfirmedStep({ bookingRef, trip }: { bookingRef: string | null; trip: TripDetails }) {
  return (
    <section className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10 text-2xl text-emerald-dark">
        ✓
      </div>
      <h2 className="mt-4 text-xl font-semibold text-midnight">Booking Confirmed</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Reference <span className="font-mono font-medium text-midnight">{bookingRef}</span>.
        A confirmation email with your receipt and pickup instructions has been sent.
      </p>
      <p className="mt-3 text-sm text-midnight/60">
        {trip.driveType === "self_drive" ? "Self-drive" : "Chauffeur-driven"} ·{" "}
        {trip.purpose === "personal" ? "Personal" : "Commercial"} · Pickup at {trip.pickupPoint} ·
        Heading to {trip.destination}
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
