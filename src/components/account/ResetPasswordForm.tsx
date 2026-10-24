"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { evaluatePasswordStrength } from "@/lib/passwordStrength";
import { isPasswordBreached } from "@/lib/breachedPassword";
import { fieldProps, FormError } from "@/components/forms/shared";
import PasswordInput from "@/components/account/PasswordInput";
import { friendlyAuthError } from "@/lib/authErrors";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: boolean; confirm?: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const strength = evaluatePasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const mismatched = password !== confirm;
    setFieldErrors({ password: !strength.meetsMinimum, confirm: mismatched });

    if (!strength.meetsMinimum) {
      setError(
        "Choose a stronger password, at least 8 characters with a mix of upper/lowercase letters, numbers, and symbols."
      );
      return;
    }
    if (mismatched) {
      setError("The two passwords don't match.");
      return;
    }

    setSaving(true);

    // Same reasoning as sign-up: someone resetting a password is exactly the
    // person likely to reach for one they use elsewhere.
    const { breached } = await isPasswordBreached(password);
    if (breached) {
      setSaving(false);
      setFieldErrors((prev) => ({ ...prev, password: true }));
      setError("This password has appeared in a data breach. Choose a different one.");
      return;
    }

    const supabase = createClient();
    // needs_password marks a guest account opened by email link; setting a
    // password here clears it, so the reminder on My account goes away.
    const { error: updateError } = await supabase.auth.updateUser({ password, data: { needs_password: false } });

    setSaving(false);

    if (updateError) {
      setError(friendlyAuthError(updateError));
      return;
    }

    // The recovery session is already a signed-in session, so there is nothing
    // more to do than land them where they were going.
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="container-shell max-w-md py-16">
      <h1 className="text-2xl font-bold text-midnight">Choose a new password</h1>
      <p className="mt-1 text-sm text-midnight/60">
        You&apos;re signed in from the reset link. Set a new password to finish.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        {error && <FormError message={error} details={fieldErrors} />}

        <label className="block">
          <span className="text-xs font-medium text-midnight/60">New password</span>
          <PasswordInput
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g. Nairobi#Drive26"
            {...fieldProps(fieldErrors.password ? "reject" : undefined)}
          
            autoComplete="new-password"
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
              <p className={`mt-1 text-xs font-medium ${strength.meetsMinimum ? "text-emerald-dark" : "text-midnight/50"}`}>
                {strength.label}
              </p>
            </div>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Confirm new password</span>
          <PasswordInput
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            {...fieldProps(fieldErrors.confirm ? "reject" : undefined)}
          
            autoComplete="new-password"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}
