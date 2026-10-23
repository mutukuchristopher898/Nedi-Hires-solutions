"use client";

import { useState } from "react";
import { DEFAULT_TOPIC, ENQUIRY_TOPICS, QUOTE_TOPICS, findTopic } from "@/lib/enquiryTopics";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { validateNamePart } from "@/lib/documentValidation/nameValidation";
import { validatePhoneNumber } from "@/lib/documentValidation/phoneValidation";
import { validateEmail } from "@/lib/formValidation/email";
import { validateMessage } from "@/lib/formValidation/freeText";
import { fieldProps, FormError } from "@/components/forms/shared";
import { RATE_LIMITED_MESSAGE } from "@/lib/bookingErrors";

export default function ContactForm({
  initialTopic = DEFAULT_TOPIC,
  initialMessage = "",
}: {
  initialTopic?: string;
  /** Starts the message box off, e.g. naming the service a quote is for. */
  initialMessage?: string;
}) {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [topic, setTopic] = useState(findTopic(initialTopic) ? initialTopic : DEFAULT_TOPIC);
  const [company, setCompany] = useState("");
  // Business enquiries are quote requests: they get a quote heading, a
  // company field and a "Request quote" button.
  const isQuote = QUOTE_TOPICS.has(topic);
  const [formError, setFormError] = useState<string | null>(null);
  // Spam trap. Hidden from people and screen readers; form-filling bots fill
  // every field they find. A filled trap gets the normal "sent" screen and
  // nothing is stored, so the bot learns nothing. The database rate limit is
  // still what stops a script posting to the API directly.
  const [website, setWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: boolean; phone?: boolean; email?: boolean; message?: boolean }>({});

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10 text-2xl text-emerald-dark">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-midnight">
          {isQuote ? "Quote request received" : "Message sent"}
        </h2>
        <p className="mt-1 text-sm text-midnight/60">
          Thank you. We’ll reply to {email || "you"}, usually within a few hours during business hours.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (website.trim() !== "") {
      setSent(true);
      return;
    }

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

    setSending(true);

    // This used to be a bare setSent(true): the message was validated and then
    // thrown away while the customer was told it had been sent. There is no
    // mail provider in this project, so enquiries are stored for the admin
    // queue at /admin/messages instead.
    const supabase = createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      // The company goes at the top of the message, so the admin inbox shows
      // it without a separate column.
      message: company.trim() ? `Company: ${company.trim()}\n\n${message.trim()}` : message.trim(),
      subject: topic,
      sender_profile_id: user?.id ?? null,
    });

    setSending(false);

    if (error) {
      setFormError(
        error.code === "54000"
          ? RATE_LIMITED_MESSAGE
          : "We couldn't send your message just now. Please try again, or reach us on WhatsApp."
      );
      return;
    }

    setSent(true);
  }

  return (
    <form noValidate className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-semibold text-midnight">{isQuote ? "Request a quote" : "Send us a message"}</h2>
        <p className="mt-1 text-sm text-midnight/60">
          {isQuote
            ? "Tell us what you need and we’ll come back with a price."
            : "We reply by email or phone, usually within a few hours."}
        </p>
      </div>
      {formError && (
        <FormError message={formError} details={fieldErrors} />
      )}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Leave this field empty
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Full Name</span>
          <input
            required
            value={name}
          autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Wanjiru"
            {...fieldProps(fieldErrors.name ? "reject" : undefined)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Phone / WhatsApp</span>
          <input
            type="tel"
            value={phone}
          autoComplete="tel"
          inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712 345 678"
            {...fieldProps(fieldErrors.phone ? "reject" : undefined)}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-midnight/60">Email</span>
        <input
          required
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. jane.wanjiru@example.com"
          {...fieldProps(fieldErrors.email ? "reject" : undefined)}
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-midnight/60">What&apos;s this about?</span>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          {...fieldProps(undefined)}
        >
          {ENQUIRY_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      {isQuote && (
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Company or organisation (optional)</span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={120}
            autoComplete="organization"
            placeholder="e.g. Acme Kenya Ltd"
            {...fieldProps(undefined)}
          />
        </label>
      )}
      <label className="block">
        <span className="text-xs font-medium text-midnight/60">How can we help?</span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={findTopic(topic)?.placeholder ?? "How can we help?"}
          {...fieldProps(fieldErrors.message ? "reject" : undefined)}
        />
      </label>
      <button
        type="submit"
        disabled={sending}
        className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
      >
        {sending ? "Sending…" : isQuote ? "Request quote" : "Send message"}
      </button>
    </form>
  );
}
