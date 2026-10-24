"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GUEST_CLAIM_KEY, forget, recall } from "@/lib/booking/guest";

// After a guest gave an email that already had an account and then signed
// in to it: moves the booking they made as a guest into this account, using
// the one-time code their browser kept (supabase 8-guest-booking.sql).
export default function ClaimPage() {
  const [token] = useState(() => (typeof window === "undefined" ? null : recall(GUEST_CLAIM_KEY)));
  const [state, setState] = useState<"working" | "done" | "none" | "failed">(token ? "working" : "none");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    createClient()
      .rpc("claim_guest_bookings", { p_token: token })
      .then(({ error }) => {
        if (error) {
          setState("failed");
          setMessage(error.message.includes("expired") ? error.message : null);
          return;
        }
        forget(GUEST_CLAIM_KEY);
        setState("done");
      });
  }, [token]);

  return (
    <div className="container-shell max-w-md py-16">
      <h1 className="text-2xl font-bold text-midnight">
        {state === "done" ? "Booking added to your account" : state === "working" ? "Adding your booking…" : "We couldn’t add your booking"}
      </h1>
      <p className="mt-3 text-sm text-midnight/65">
        {state === "done" && "Your booking request is now in your account, together with the documents you uploaded."}
        {state === "working" && "One moment."}
        {state === "none" && "There’s no booking waiting to be added from this browser. If you booked on another device, please contact us and we’ll move it for you."}
        {state === "failed" && (message ?? "Please try again in a moment, or contact us and we’ll move it for you.")}
      </p>
      {state !== "working" && (
        <Link
          href={state === "done" ? "/account" : "/contact"}
          className="mt-6 inline-block rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
        >
          {state === "done" ? "View my bookings" : "Contact us"}
        </Link>
      )}
    </div>
  );
}
