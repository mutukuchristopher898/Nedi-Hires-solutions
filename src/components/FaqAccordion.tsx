"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How do I book a car?",
    a: "Choose a car on Our Fleet, add your trip details and documents, and send a booking request. No payment is taken online. We review your request, then contact you by phone or WhatsApp to confirm and arrange the deposit. Your booking is confirmed once the deposit is received.",
  },
  {
    q: "How do I pay?",
    a: "We arrange payment with you directly when we confirm your booking. You'll see the price and the deposit due before you send your request, so there are no surprises.",
  },
  {
    q: "What documents do I need?",
    a: "A national ID or passport, and a valid driving licence if you're driving yourself. You upload clear photos while booking, and our team reviews them before any vehicle is released.",
  },
  {
    q: "Can I hire a car with a driver?",
    a: "Yes. Choose chauffeur driven when you book, or ask us for a quote for group and event transport.",
  },
  {
    q: "I have my own vehicle. Can you provide just a driver?",
    a: "Yes. Our Driver Hire service provides a driver for your own car, van or company vehicles, by the day, the week or longer. Request a quote from the Driver Hire page.",
  },
  {
    q: "Do you lease vehicles to companies?",
    a: "Yes. Corporate Leasing covers single vehicles or whole fleets, on weekly, monthly or longer terms. Request a quote and we'll put together an arrangement for your company.",
  },
  {
    q: "Do you provide replacement cars for insurance companies?",
    a: "Yes. We work with insurers, brokers and assessors to provide a vehicle for their customers while their own car is being repaired. If your car is under repair, ask your insurer whether they can book one with us.",
  },
  {
    q: "I own a vehicle. Can you manage it for me?",
    a: "Yes, through our Vehicle Partnership. We inspect your vehicle, agree your percentage and terms with you, then rent it out and look after it, and you earn an agreed share of what it makes. See Partner with us for details.",
  },
  {
    q: "Can I cancel or change my booking?",
    a: "Contact us with your booking reference as early as possible. We handle changes and cancellations case by case.",
  },
  {
    q: "Where do you operate?",
    a: "We're based in Nairobi and serve customers across Kenya. Tell us where you're going and we'll confirm what we can arrange.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
      {FAQS.map((item, i) => (
        <div key={item.q}>
          <h3>
            <button
              type="button"
              aria-expanded={open === i}
              aria-controls={`faq-answer-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-midnight"
            >
              {item.q}
              {/* The rotating "+" is decoration; aria-expanded carries the state. */}
              <span aria-hidden="true" className={`shrink-0 text-gold-dark transition ${open === i ? "rotate-45" : ""}`}>
                +
              </span>
            </button>
          </h3>
          <p
            id={`faq-answer-${i}`}
            hidden={open !== i}
            className="px-5 pb-4 text-sm text-midnight/60"
          >
            {item.a}
          </p>
        </div>
      ))}
    </div>
  );
}
