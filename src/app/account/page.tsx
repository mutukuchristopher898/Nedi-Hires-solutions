"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/StatusBadge";
import DemoTag from "@/components/DemoTag";

const MOCK_BOOKINGS = [
  { ref: "BK-88421", vehicle: "Toyota Harrier (2018)", dates: "Aug 20 – Aug 24, 2026", status: "approved" as const, total: "KES 30,000" },
  { ref: "BK-87910", vehicle: "Toyota Alphard (2018)", dates: "Jul 02 – Jul 04, 2026", status: "approved" as const, total: "KES 37,000" },
  { ref: "BK-88502", vehicle: "Toyota Land Cruiser Safari", dates: "Sep 10 – Sep 13, 2026", status: "pending" as const, total: "KES 66,000" },
];

const MOCK_DOCS = [
  { type: "International Passport", status: "approved" as const, submittedOn: "2026-06-30" },
  { type: "Driver's License", status: "approved" as const, submittedOn: "2026-06-30" },
];

type Tab = "bookings" | "documents" | "profile";

export default function AccountPage() {
  const { user, profile, ready, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("bookings");
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const name = nameOverride ?? profile?.full_name ?? "";
  const phone = phoneOverride ?? profile?.phone ?? "";

  if (!ready) return null;

  if (!user) {
    return (
      <div className="container-shell max-w-md py-20 text-center">
        <h1 className="text-2xl font-bold text-midnight">Your Account</h1>
        <p className="mt-2 text-sm text-midnight/60">
          Sign in to view your bookings, documents, and profile.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account/sign-in" className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white">
            Sign In
          </Link>
          <Link href="/account/sign-up" className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-midnight/5">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user!.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="container-shell py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-midnight">
            Welcome back, {displayName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-midnight/60">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-midnight/70 transition hover:bg-midnight/5"
        >
          Sign Out
        </button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-line">
        {(["bookings", "documents", "profile"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition ${
              tab === t
                ? "border-b-2 border-gold text-midnight"
                : "text-midnight/50 hover:text-midnight"
            }`}
          >
            {t === "bookings" ? "My Bookings" : t}
          </button>
        ))}
      </div>

      {tab === "bookings" && (
        <div>
          <div className="mt-4 flex justify-end">
            <DemoTag />
          </div>
          <div className="mt-2 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full text-sm">
              <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-midnight/50">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {MOCK_BOOKINGS.map((b) => (
                  <tr key={b.ref}>
                    <td className="px-5 py-3 font-mono text-xs text-midnight/70">{b.ref}</td>
                    <td className="px-5 py-3 font-medium text-midnight">{b.vehicle}</td>
                    <td className="px-5 py-3 text-midnight/70">{b.dates}</td>
                    <td className="px-5 py-3 text-midnight/70">{b.total}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="mt-6 space-y-3">
          <div className="flex justify-end">
            <DemoTag />
          </div>
          {MOCK_DOCS.map((d) => (
            <div key={d.type} className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-line">
              <div>
                <div className="font-medium text-midnight">{d.type}</div>
                <div className="text-xs text-midnight/50">Submitted {d.submittedOn}</div>
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
          <button className="rounded-md border border-dashed border-line px-4 py-3 text-sm font-medium text-midnight/60 transition hover:bg-midnight/5">
            + Upload Another Document
          </button>
        </div>
      )}

      {tab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="mt-6 max-w-md space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line"
        >
          <label className="block">
            <span className="text-xs font-medium text-midnight/60">Full Name</span>
            <input
              value={name}
              onChange={(e) => setNameOverride(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-midnight/60">Email</span>
            <input
              disabled
              value={user.email ?? ""}
              className="mt-1 w-full rounded-md border border-line bg-offwhite px-3 py-2 text-sm text-midnight/60"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-midnight/60">Phone / WhatsApp</span>
            <input
              value={phone}
              onChange={(e) => setPhoneOverride(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && <p className="text-sm text-emerald-dark">Saved.</p>}
        </form>
      )}
    </div>
  );
}
