"use client";

import { useState } from "react";
import Link from "next/link";
import { classifications } from "@/lib/data";
import { findCatalogEntry, getMakes, getModelsForMake } from "@/lib/vehicleCatalog";

type Stage = "account" | "unit" | "done";

export default function PartnerOnboardingPage() {
  const [stage, setStage] = useState<Stage>("account");
  const [businessName, setBusinessName] = useState("");
  const [make, setMake] = useState("");
  const [vehicleName, setVehicleName] = useState("");

  const makes = getMakes();
  const models = make ? getModelsForMake(make) : [];
  const catalogEntry = make && vehicleName ? findCatalogEntry(make, vehicleName) : undefined;

  return (
    <div className="container-shell max-w-2xl py-12">
      <h1 className="text-2xl font-bold text-midnight">Partner Onboarding</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Register your business and submit your first vehicle for admin approval.
      </p>

      <ol className="mt-6 flex gap-4 text-sm">
        <StepPill active={stage === "account"} done={stage !== "account"} label="1. Account Creation" />
        <StepPill active={stage === "unit"} done={stage === "done"} label="2. Unit Specification" />
        <StepPill active={stage === "done"} done={false} label="3. Pending Review" />
      </ol>

      {stage === "account" && (
        <form
          className="mt-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line"
          onSubmit={(e) => {
            e.preventDefault();
            setStage("unit");
          }}
        >
          <Field label="Business / Host Name">
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none"
              placeholder="e.g. Rift Valley Rides"
            />
          </Field>
          <Field label="Business Email">
            <input required type="email" className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none" />
          </Field>
          <Field label="Tax Credential / Business License">
            <input type="file" className="block w-full text-sm text-midnight/70" />
          </Field>
          <Field label="Personal Identity Document (for individual hosts)">
            <input type="file" className="block w-full text-sm text-midnight/70" />
          </Field>

          <button
            type="submit"
            className="rounded-md bg-emerald px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-dark"
          >
            Continue to Vehicle Details
          </button>
        </form>
      )}

      {stage === "unit" && (
        <form
          className="mt-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line"
          onSubmit={(e) => {
            e.preventDefault();
            setStage("done");
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make">
              <select
                required
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  setVehicleName("");
                }}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none"
              >
                <option value="" disabled>
                  Select make
                </option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Model">
              <select
                required
                disabled={!make}
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none disabled:opacity-60"
              >
                <option value="" disabled>
                  {make ? "Select model" : "Select a make first"}
                </option>
                {models.map((m) => (
                  <option key={m.model} value={m.model}>
                    {m.model}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <input required type="number" min={1990} max={2027} className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none" placeholder="2023" />
            </Field>
            <Field label="License Plate">
              <input required className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none" placeholder="KDX 123A" />
            </Field>
            <Field label="Classification">
              <select required className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none">
                {classifications.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Fuel Type">
              <select
                required
                key={catalogEntry?.model ?? "default"}
                defaultValue={catalogEntry?.fuelType[0] ?? "Petrol"}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none"
              >
                {(catalogEntry?.fuelType ?? ["Petrol", "Diesel", "Hybrid", "Electric"]).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Transmission">
              <select
                required
                key={catalogEntry?.model ?? "default"}
                defaultValue={catalogEntry?.transmission[0] ?? "Automatic"}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none"
              >
                {(catalogEntry?.transmission ?? ["Automatic", "Manual"]).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Capacity (seats)">
              <input required type="number" min={1} max={60} className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none" placeholder="5" />
            </Field>
          </div>

          {catalogEntry && (
            <p className="rounded-md bg-offwhite px-3 py-2 text-xs text-midnight/60">
              Typical spec for {catalogEntry.make} {catalogEntry.model}: {catalogEntry.cc} ·{" "}
              common colours: {catalogEntry.colors.join(", ")}. General reference — confirm
              against your actual unit.
            </p>
          )}

          <button
            type="submit"
            className="rounded-md bg-emerald px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-dark"
          >
            Submit for Admin Approval
          </button>
        </form>
      )}

      {stage === "done" && (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber/10 text-2xl text-amber">
            ⏳
          </div>
          <h2 className="mt-4 text-xl font-semibold text-midnight">Submitted — Pending Review</h2>
          <p className="mt-1 text-sm text-midnight/60">
            {businessName || "Your business"} and {vehicleName || "your vehicle"} have been
            queued for manual and automated admin checks. You&apos;ll be notified once approved.
          </p>
          <Link
            href="/partners/dashboard"
            className="mt-6 inline-block rounded-md bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal"
          >
            Go to Partner Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <li
      className={`rounded-full px-3 py-1.5 ${
        active
          ? "bg-emerald text-white font-medium"
          : done
          ? "bg-emerald/10 text-emerald-dark"
          : "bg-midnight/5 text-midnight/50"
      }`}
    >
      {label}
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-midnight/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
