"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { evaluatePasswordStrength } from "@/lib/passwordStrength";

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const strength = evaluatePasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!strength.meetsMinimum) {
      setError("Please choose a stronger password — at least 8 characters with a mix of upper/lowercase letters, numbers, and symbols.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push(next);
    } else {
      // Email confirmation is required before a session is issued.
      setNeedsConfirmation(true);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="container-shell max-w-md py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10 text-2xl text-emerald-dark">
          ✉️
        </div>
        <h1 className="mt-4 text-xl font-semibold text-midnight">Check your email</h1>
        <p className="mt-2 text-sm text-midnight/60">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
          account, then sign in.
        </p>
        <Link
          href={`/account/sign-in?next=${encodeURIComponent(next)}`}
          className="mt-6 inline-block rounded-md bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell max-w-md py-16">
      <h1 className="text-2xl font-bold text-midnight">Create an Account</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Book faster, track your rentals, and manage your documents in one place.
      </p>

      <form className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Full Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Wanjiru"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jane.wanjiru@example.com"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Phone / WhatsApp</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712 345 678"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Password</span>
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g. Nairobi#Drive26"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < strength.score
                        ? ["bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-dark"][strength.score - 1]
                        : "bg-midnight/10"
                    }`}
                  />
                ))}
              </div>
              <p
                className={`mt-1 text-xs font-medium ${strength.meetsMinimum ? "text-emerald-dark" : "text-midnight/50"}`}
              >
                {strength.label}
                {!strength.meetsMinimum && " — needs 8+ characters and a mix of upper/lowercase, numbers, and symbols"}
              </p>
            </div>
          )}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-midnight/60">
        Already have an account?{" "}
        <Link
          href={`/account/sign-in?next=${encodeURIComponent(next)}`}
          className="font-medium text-gold-dark hover:text-gold"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
