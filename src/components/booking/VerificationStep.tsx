"use client";

export default function VerificationStep({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">6. Identity Verification</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Passport, driver&apos;s licence or national ID, reviewed by our team, never shared with
        third parties.
      </p>

      <div className="mt-5 rounded-lg bg-amber/10 p-4 text-sm">
        <p className="font-medium text-amber">We&apos;re reviewing your documents</p>
        {/* Previously read "In production, an admin reviews this from the
            internal queue" above a button labelled "Simulate Admin Approval".
            That was scaffolding from before the review queue existed. The queue
            is real now, so this says what actually happens: you can carry on to
            settlement, and the vehicle is released once the documents clear. */}
        <p className="mt-1 text-midnight/60">
          This usually takes under an hour during business hours. You can carry on and settle now 
          the vehicle is released once your documents clear. We&apos;ll be in touch if anything
          needs a better copy, and you can check the status any time from your account.
        </p>
        <button
          onClick={onContinue}
          className="mt-4 rounded-md bg-emerald px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-dark"
        >
          Continue to settlement
        </button>
      </div>
    </section>
  );
}
