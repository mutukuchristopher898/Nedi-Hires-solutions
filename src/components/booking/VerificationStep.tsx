"use client";

export default function VerificationStep({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">5. Identity Verification Queue</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Your documents and details are queued for admin review before final settlement.
      </p>

      <div className="mt-5 rounded-lg bg-amber/10 p-4 text-sm text-amber">
        <p className="font-medium">Pending Admin Review</p>
        <p className="mt-1 text-midnight/60">
          Your submitted documents are awaiting validation. In production, an admin reviews
          this from the internal queue.
        </p>
        <button
          onClick={onContinue}
          className="mt-4 rounded-md bg-emerald px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-dark"
        >
          Simulate Admin Approval → Continue
        </button>
      </div>
    </section>
  );
}
