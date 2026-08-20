"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/data";
import StatusBadge from "@/components/StatusBadge";

type Tab = "bookings" | "documents" | "profile";

interface BookingRow {
  id: string;
  booking_ref: string;
  status: "deposit_pending" | "verification_pending" | "settlement_pending" | "confirmed" | "cancelled";
  total_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  pickup_point: string | null;
  destination: string | null;
  purpose: "personal" | "commercial" | null;
  drive_type: "self_drive" | "chauffeur" | null;
  vehicles: { make: string; model: string; year: number } | null;
}

interface DocumentRow {
  id: string;
  doc_type: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
}

const BOOKING_STATUS_STYLES: Record<BookingRow["status"], string> = {
  deposit_pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  verification_pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  settlement_pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  confirmed: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  cancelled: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
};

const BOOKING_STATUS_LABELS: Record<BookingRow["status"], string> = {
  deposit_pending: "Deposit Pending",
  verification_pending: "Verification Pending",
  settlement_pending: "Settlement Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function BookingStatusBadge({ status }: { status: BookingRow["status"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BOOKING_STATUS_STYLES[status]}`}>
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function AccountPage() {
  const { user, profile, ready, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("bookings");
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const name = nameOverride ?? profile?.full_name ?? "";
  const phone = phoneOverride ?? profile?.phone ?? "";

  useEffect(() => {
    if (!user) return;

    let ignore = false;

    (async () => {
      setLoadingRecords(true);
      const supabase = createClient();
      const [bookingsRes, documentsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, booking_ref, status, total_amount, currency, start_date, end_date, pickup_point, destination, purpose, drive_type, vehicles(make, model, year)"
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("identity_documents")
          .select("id, doc_type, status, submitted_at")
          .eq("customer_id", user.id)
          .order("submitted_at", { ascending: false }),
      ]);

      if (!ignore) {
        setBookings((bookingsRes.data as unknown as BookingRow[]) ?? []);
        setDocuments((documentsRes.data as DocumentRow[]) ?? []);
        setLoadingRecords(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user]);

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
        <div className="mt-4">
          {loadingRecords ? (
            <p className="text-sm text-midnight/50">Loading your bookings…</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
              <p className="text-sm text-midnight/60">You don&apos;t have any bookings yet.</p>
              <Link
                href="/search"
                className="mt-4 inline-block rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
              >
                Browse Vehicles
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
              <table className="w-full text-sm">
                <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-midnight/50">
                  <tr>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Vehicle</th>
                    <th className="px-5 py-3">Trip</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="px-5 py-3 font-mono text-xs text-midnight/70">{b.booking_ref}</td>
                      <td className="px-5 py-3 font-medium text-midnight">
                        {b.vehicles ? `${b.vehicles.make} ${b.vehicles.model} (${b.vehicles.year})` : "—"}
                      </td>
                      <td className="px-5 py-3 text-midnight/70">
                        {b.drive_type
                          ? `${b.drive_type === "self_drive" ? "Self-drive" : "Chauffeur"} · ${
                              b.purpose === "commercial" ? "Commercial" : "Personal"
                            }${b.destination ? ` · ${b.destination}` : ""}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-midnight/70">{formatDateRange(b.start_date, b.end_date)}</td>
                      <td className="px-5 py-3 text-midnight/70">{formatMoney(b.total_amount, b.currency)}</td>
                      <td className="px-5 py-3">
                        <BookingStatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="mt-6 space-y-3">
          {loadingRecords ? (
            <p className="text-sm text-midnight/50">Loading your documents…</p>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
              <p className="text-sm text-midnight/60">
                No documents submitted yet. You&apos;ll be asked to verify your identity during checkout.
              </p>
            </div>
          ) : (
            documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-line">
                <div>
                  <div className="font-medium text-midnight">{d.doc_type}</div>
                  <div className="text-xs text-midnight/50">
                    Submitted {new Date(d.submitted_at).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))
          )}
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
