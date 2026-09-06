"use client";

import Link from "next/link";
import { site } from "@/lib/site";

// Previously a thrown error — a Supabase outage, a bad env var, anything
// inside a server component's data fetch — surfaced as an unstyled
// "Application error" with no recovery path and no support contact.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-shell py-20">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-bold text-midnight">This page didn&apos;t load</h1>
        <p className="mt-3 text-sm text-midnight/60">
          The problem is on our side, not yours. Nothing you were doing has been lost — try again,
          and if it keeps happening let us know.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-md border border-line px-6 py-3 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
          >
            Back to home
          </Link>
        </div>

        <p className="mt-8 text-sm text-midnight/50">
          Need a hand?{" "}
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gold-dark hover:text-gold"
          >
            Message us on WhatsApp
          </a>{" "}
          or call {site.phoneDisplay}.
        </p>
      </div>
    </div>
  );
}
