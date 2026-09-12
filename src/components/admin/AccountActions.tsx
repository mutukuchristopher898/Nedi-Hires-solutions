"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AdminAccount } from "@/lib/supabase/queries";

export default function AccountActions({
  account,
  isSelf,
}: {
  account: AdminAccount;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState(account.role);
  const [busy, setBusy] = useState<"reset" | "role" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendReset() {
    if (!account.email) {
      setError("This account has no email on file.");
      return;
    }

    setBusy("reset");
    setError(null);
    setMessage(null);

    // No privileged key involved: resetPasswordForEmail needs no session at
    // all — it is the same call the public forgot-password form makes. The
    // link goes to the account's own inbox, so an admin can start the reset
    // but never sees or sets the password.
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(account.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    });

    setBusy(null);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage(`Reset link sent to ${account.email}.`);
  }

  async function changeRole(next: AdminAccount["role"]) {
    const previous = role;
    setRole(next);
    setBusy("role");
    setError(null);
    setMessage(null);

    // Asking for the row back, because an update that matches nothing is a
    // success as far as PostgREST is concerned — so without this an RLS
    // change could turn this into a button that silently does nothing.
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ role: next })
      .eq("id", account.id)
      .select("id, role");

    setBusy(null);

    if (updateError) {
      setRole(previous);
      setError(updateError.message);
      return;
    }

    if (!data || data.length === 0) {
      setRole(previous);
      setError("That change didn't apply — you may not have permission.");
      return;
    }
    setMessage(`Role changed to ${next}.`);
    router.refresh();
  }

  return (
    <div className="shrink-0 text-right">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={role}
          disabled={busy !== null || isSelf}
          onChange={(e) => changeRole(e.target.value as AdminAccount["role"])}
          aria-label={`Role for ${account.fullName}`}
          title={isSelf ? "You cannot change your own role" : undefined}
          className="rounded-md border border-line px-2 py-1.5 text-xs focus:border-gold focus:outline-none disabled:opacity-50"
        >
          <option value="customer">Customer</option>
          <option value="partner">Partner</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="button"
          disabled={busy !== null || !account.email}
          onClick={sendReset}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5 disabled:opacity-50"
        >
          {busy === "reset" ? "Sending…" : "Send reset link"}
        </button>
      </div>

      {isSelf && (
        <p className="mt-1 text-xs text-midnight/40">
          Your own account — role locked so you can&apos;t demote yourself out of here.
        </p>
      )}
      {message && <p className="mt-1 text-xs text-emerald-dark">{message}</p>}
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
