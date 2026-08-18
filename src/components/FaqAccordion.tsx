"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How does the reservation deposit work?",
    a: "When you book, you pay a small reservation deposit online to hold the vehicle for your chosen dates. The remaining balance and any security deposit are settled after identity verification, either online or at handoff.",
  },
  {
    q: "What documents do I need to verify my identity?",
    a: "We accept an International Passport, a valid Driver's License, or a National ID. Upload a clear photo during the booking flow — our team or the vehicle partner reviews it before final settlement.",
  },
  {
    q: "Can I hire a chauffeur instead of self-driving?",
    a: "Yes. Most of our Luxury and SUV vehicles are available chauffeur-driven — select this when booking or mention it via Contact Support for group and event transport.",
  },
  {
    q: "What happens if a partner vehicle is still 'Pending'?",
    a: "Newly listed partner vehicles go through an admin approval queue and only appear in search results once approved, so every vehicle you can book has already passed our quality checks.",
  },
  {
    q: "Can I cancel or change my booking?",
    a: "Reach out via Contact Support with your booking reference as soon as possible. Reservation deposits are generally non-refundable within 24 hours of pickup, but we handle changes case by case.",
  },
  {
    q: "How do Mobility Subscriptions work?",
    a: "Subscriptions are all-inclusive monthly plans that grant tiered access to vehicles with a set number of swaps per month — ideal if you need a vehicle regularly without owning one.",
  },
  {
    q: "How do I list my own vehicle?",
    a: "Head to Partner Onboarding to register your business or host profile and submit your vehicle's details. It enters our admin approval queue and goes live once verified.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
      {FAQS.map((item, i) => (
        <div key={item.q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-midnight"
          >
            {item.q}
            <span className={`shrink-0 text-gold-dark transition ${open === i ? "rotate-45" : ""}`}>+</span>
          </button>
          {open === i && (
            <p className="px-5 pb-4 text-sm text-midnight/60">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
