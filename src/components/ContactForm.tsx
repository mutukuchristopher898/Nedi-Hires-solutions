"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10 text-2xl text-emerald-dark">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-midnight">Message Sent</h2>
        <p className="mt-1 text-sm text-midnight/60">
          Thanks for reaching out — our team typically replies within a few hours.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Full Name</span>
          <input
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Phone / WhatsApp</span>
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-midnight/60">Email</span>
        <input
          required
          type="email"
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-midnight/60">How can we help?</span>
        <textarea
          required
          rows={4}
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          placeholder="Tell us about your trip, dates, and preferred vehicle..."
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
      >
        Send Message
      </button>
    </form>
  );
}
