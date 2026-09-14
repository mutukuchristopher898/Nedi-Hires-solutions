"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/formValidation/email";
import { fieldProps, FormError } from "@/components/forms/shared";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

const LINK_ERRORS: Record<string, string> = {
  link_invalid:
    "That link didn't carry a sign-in code. Request a new password reset below, and open the link in this same browser.",
  link_expired:
    "That link has expired or was already used. Password reset links work once and time out quickly, request a new one below.",
  link_incomplete:
    "That link didn't complete the sign-in. Request a new password reset below, and open it in the same browser you requested it from.",
};

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  // The auth callback redirects here with a reason when an emailed link
  // doesn't work. Without showing it, a failed reset looked identical to a
  // blank sign-in page — which is why "the link is broken" was impossible to
  // diagnose from the outside.
  const linkError = LINK_ERRORS[searchParams.get("error") ?? ""] ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailResult = validateEmail(email);
    const passwordMissing = !password;
    setFieldErrors({ email: !emailResult.valid, password: passwordMissing });

    if (!emailResult.valid || passwordMissing) {
      setError("Please fix the highlighted fields below.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(next);
  }

  return (
    <div className="container-shell max-w-md py-16">
      <h1 className="text-2xl font-bold text-midnight">Sign In</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Access your bookings, documents, and profile.
      </p>

      <form noValidate className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line" onSubmit={handleSubmit}>
        {(error || linkError) && (
          <FormError message={error ?? linkError!} details={fieldErrors} />
        )}

        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jane.wanjiru@example.com"
            {...fieldProps(fieldErrors.email ? "reject" : undefined)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Password</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...fieldProps(fieldErrors.password ? "reject" : undefined)}
          />
        </label>

        <p className="text-right">
          <Link href="/account/forgot-password" className="text-xs font-medium text-gold-dark hover:text-gold">
            Forgot your password?
          </Link>
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-midnight/60">
        Don&apos;t have an account?{" "}
        <Link
          href={`/account/sign-up?next=${encodeURIComponent(next)}`}
          className="font-medium text-gold-dark hover:text-gold"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
