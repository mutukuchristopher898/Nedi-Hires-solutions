"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountLifecycleActions({
  id,
  fullName,
  email,
  suspendedAt,
  anonymisedAt,
  isSelf,
  canManage,
}: {
  id: string;
  fullName: string;
  email: string | null;
  suspendedAt: string | null;
  anonymisedAt: string | null;
  isSelf: boolean;
  /** Suspension and erasure are admin-only; staff see the account but not these. */
  canManage: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "suspending" | "erasing">("idle");
  const [reason, setReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) {
    return <p className="text-xs text-midnight/40">Suspension and erasure are admin-only.</p>;
  }

  if (isSelf) {
    return (
      <p className="text-xs text-midnight/40">
        This is your own account — you can&apos;t suspend or erase it from here.
      </p>
    );
  }

  if (anonymisedAt) {
    return (
      <p className="text-xs text-midnight/50">
        Erased on {new Date(anonymisedAt).toLocaleDateString("en-KE")}. Nothing further to do.
      </p>
    );
  }

  async function setSuspension(suspend: boolean) {
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(
        suspend
          ? { suspended_at: new Date().toISOString(), suspension_reason: reason.trim() || "No reason given" }
          : { suspended_at: null, suspension_reason: null }
      )
      .eq("id", id)
      .select("id");

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("That didn't apply — you may not have permission.");
      return;
    }

    setMode("idle");
    setReason("");
    router.refresh();
  }

  async function erase() {
    setBusy(true);
    setError(null);

    // Through a route rather than straight to the database: the stored
    // identity documents have to be removed from the bucket too, and SQL
    // cannot reach the storage API.
    const response = await fetch("/api/admin/erase-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id, confirmEmail }),
    });

    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);

    if (!response.ok) {
      setError(result.error ?? "Could not erase this account.");
      return;
    }

    setMode("idle");
    router.refresh();
  }

  if (mode === "suspending") {
    return (
      <div className="rounded-md bg-amber/5 p-3 ring-1 ring-amber/20">
        <p className="text-xs font-medium text-midnight">Suspend {fullName}?</p>
        <p className="mt-1 text-xs text-midnight/60">
          They keep access to hires they already have, but cannot make a new booking, send an
          enquiry or list a vehicle. Reversible at any time.
        </p>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (shown only to staff)"
          aria-label="Suspension reason"
          className="mt-2 w-full rounded-md border border-line px-2 py-1.5 text-xs focus:border-gold focus:outline-none"
        />
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={busy} onClick={() => setSuspension(true)}
            className="rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {busy ? "Suspending…" : "Suspend"}
          </button>
          <button type="button" onClick={() => setMode("idle")}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5">
            Cancel
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (mode === "erasing") {
    return (
      <div className="rounded-md bg-red-500/5 p-3 ring-1 ring-red-500/20">
        <p className="text-xs font-medium text-midnight">Erase {fullName}?</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-midnight/60">
          <li>Name, email, phone and identity details are scrubbed</li>
          <li>Uploaded ID documents are deleted from storage permanently</li>
          <li>Bookings and their amounts are kept, so your accounts still balance</li>
          <li>This cannot be undone</li>
        </ul>
        <p className="mt-2 text-xs text-midnight/60">
          Type <strong className="text-midnight">{email ?? "the account email"}</strong> to confirm.
        </p>
        <input
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder="Account email"
          aria-label="Type the account email to confirm erasure"
          className="mt-2 w-full rounded-md border border-line px-2 py-1.5 text-xs focus:border-gold focus:outline-none"
        />
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={busy || !confirmEmail.trim()} onClick={erase}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
            {busy ? "Erasing…" : "Erase permanently"}
          </button>
          <button type="button" onClick={() => { setMode("idle"); setConfirmEmail(""); }}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5">
            Cancel
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {suspendedAt ? (
          <button type="button" disabled={busy} onClick={() => setSuspension(false)}
            className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark disabled:opacity-60">
            {busy ? "Restoring…" : "Lift suspension"}
          </button>
        ) : (
          <button type="button" onClick={() => setMode("suspending")}
            className="rounded-md border border-amber/40 px-3 py-1.5 text-xs font-semibold text-amber transition hover:bg-amber/10">
            Suspend
          </button>
        )}
        <button type="button" onClick={() => setMode("erasing")}
          className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10">
          Erase account
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
