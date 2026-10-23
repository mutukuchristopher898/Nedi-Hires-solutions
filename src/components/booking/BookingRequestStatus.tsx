"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { site } from "@/lib/site";

// What a customer sees after sending a booking request. Until online payment
// is ready, an admin confirms each booking (Admin, Bookings) once the deposit
// is arranged; this page reflects whichever stage the booking has reached.

type Status = "deposit_pending" | "verification_pending" | "settlement_pending" | "confirmed" | "cancelled";

export default function BookingRequestStatus({ bookingId }: { bookingId: string | null | undefined }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    let live = true;
    createClient()
      .from("bookings")
      .select("status, booking_ref")
      .eq("id", bookingId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!live) return;
        if (error || !data) setFailed(true);
        else {
          setStatus(data.status as Status);
          setRef(data.booking_ref as string);
        }
      });
    return () => {
      live = false;
    };
  }, [bookingId]);

  const whatsapp = `${site.whatsappHref}?text=${encodeURIComponent(`Hello, about my booking request ${ref ?? ""}`.trim())}`;

  if (failed) {
    return (
      <section className="rounded-2xl bg-white p-8 ring-1 ring-line">
        <h2 className="text-lg font-semibold text-midnight">We couldn&apos;t load your booking</h2>
        <p className="mt-2 text-sm text-midnight/65">
          Your request may still have been sent. Check{" "}
          <Link href="/account" className="font-semibold text-gold-dark hover:text-gold">
            your bookings
          </Link>
          , or message us on WhatsApp.
        </p>
      </section>
    );
  }

  if (!status) {
    return <section className="rounded-2xl bg-white p-8 text-sm text-midnight/60 ring-1 ring-line">Loading your booking…</section>;
  }

  const confirmed = status === "confirmed";
  const cancelled = status === "cancelled";

  return (
    <section className="rounded-2xl bg-white p-8 ring-1 ring-line">
      <p className="text-sm text-midnight/55">Booking reference</p>
      <p className="mt-1 text-2xl font-bold tracking-wide text-midnight">{ref}</p>

      <h2 className="mt-6 text-xl font-semibold text-midnight">
        {confirmed ? "Your booking is confirmed" : cancelled ? "This booking was cancelled" : "We’ve received your booking request"}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-midnight/70">
        {confirmed
          ? "Everything is in place. We’ll be in touch about handover details."
          : cancelled
            ? "If you didn’t expect this, message us and we’ll help."
            : "No payment has been taken. Here’s what happens next:"}
      </p>

      {!confirmed && !cancelled && (
        <ol className="mt-5 space-y-3 text-sm text-midnight/75">
          {[
            "We check your request and your documents.",
            "We contact you by phone or WhatsApp to confirm the details and arrange the deposit.",
            "Once the deposit is received, your booking is confirmed and shows here and in your account.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/60 text-xs font-semibold text-gold-dark">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/account"
          className="rounded-md bg-gold px-5 py-3 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
        >
          View my bookings
        </Link>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-line px-5 py-3 text-center text-sm font-semibold text-midnight transition hover:border-gold hover:text-gold-dark"
        >
          Message us on WhatsApp
        </a>
      </div>
    </section>
  );
}
