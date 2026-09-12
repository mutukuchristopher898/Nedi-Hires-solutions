"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/formValidation/email";
import { fieldProps, FormError } from "@/components/forms/shared";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = validateEmail(email);
    setInvalid(!result.valid);
    if (!result.valid) {
      setError("Enter the email address you signed up with.");
      return;
    }

    setSending(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    });

    setSending(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="container-shell max-w-md py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10 text-2xl text-emerald-dark">
          ✉️
        </div>
        <h1 className="mt-4 text-xl font-semibold text-midnight">Check your email</h1>
        <p className="mt-2 text-sm text-midnight/60">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your
          password. It expires shortly, so use it soon.
        </p>
        <Link
          href="/account/sign-in"
          className="mt-6 inline-block rounded-md bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell max-w-md py-16">
      <h1 className="text-2xl font-bold text-midnight">Reset your password</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Enter your email and we&apos;ll send you a link to set a new one.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        {error && <FormError message={error} />}

        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jane.wanjiru@example.com"
            {...fieldProps(invalid ? "reject" : undefined)}
          />
        </label>

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-midnight/60">
        Remembered it?{" "}
        <Link href="/account/sign-in" className="font-medium text-gold-dark hover:text-gold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
