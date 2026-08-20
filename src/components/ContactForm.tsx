"use client";

import { useState } from "react";
import { validateNamePart } from "@/lib/documentValidation/nameValidation";
import { validatePhoneNumber } from "@/lib/documentValidation/phoneValidation";
import { validateEmail } from "@/lib/formValidation/email";
import { validateMessage } from "@/lib/formValidation/freeText";
import { fieldClass } from "@/components/forms/shared";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: boolean; phone?: boolean; email?: boolean; message?: boolean }>({});

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const nameResult = validateNamePart(name, "Full name");
    const phoneResult = phone.trim() ? validatePhoneNumber(phone, "KE", "Phone number") : { valid: true };
    const emailResult = validateEmail(email);
    const messageResult = validateMessage(message, "Message");

    setFieldErrors({
      name: !nameResult.valid,
      phone: !phoneResult.valid,
      email: !emailResult.valid,
      message: !messageResult.valid,
    });

    if (!nameResult.valid || !phoneResult.valid || !emailResult.valid || !messageResult.valid) {
      setFormError("Please fix the highlighted fields below.");
      return;
    }

    setSent(true);
  }

  return (
    <form noValidate className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line" onSubmit={handleSubmit}>
      {formError && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{formError}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Full Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Wanjiru"
            className={fieldClass(fieldErrors.name ? "reject" : undefined)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Phone / WhatsApp</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712 345 678"
            className={fieldClass(fieldErrors.phone ? "reject" : undefined)}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-midnight/60">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. jane.wanjiru@example.com"
          className={fieldClass(fieldErrors.email ? "reject" : undefined)}
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-midnight/60">How can we help?</span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your trip, dates, and preferred vehicle..."
          className={fieldClass(fieldErrors.message ? "reject" : undefined)}
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
