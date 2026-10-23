import type { Metadata } from "next";
import Link from "next/link";
import { LogoLockup } from "@/components/Logo";
import SocialLinks from "@/components/SocialLinks";
import { site } from "@/lib/site";

// What visitors see before launch (SITE_LAUNCHED in src/lib/features.ts).
// It covers the whole screen, header and footer included, because their links
// lead to pages that are not open yet.

export const metadata: Metadata = {
  title: "Coming soon",
  description: site.description,
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br from-teal-dark via-teal to-terracotta text-white">
      <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <LogoLockup light width={220} />

        <h1 className="mt-12 font-serif text-4xl leading-tight sm:text-5xl">Coming soon</h1>
        <p className="mt-5 text-base leading-relaxed text-white/70">
          Car hire, drivers and fleet leasing across Kenya. Our new website opens shortly. In the
          meantime, we&apos;re taking bookings and enquiries by phone, WhatsApp and email.
        </p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href={`tel:${site.phoneTel}`}
            className="rounded-md bg-gold px-7 py-3.5 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
          >
            Call {site.phoneDisplay}
          </a>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            WhatsApp us
          </a>
        </div>

        <a href={`mailto:${site.email}`} className="mt-5 text-sm text-white/70 transition hover:text-gold">
          {site.email}
        </a>

        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-sm text-white/50">Follow us</p>
          <SocialLinks tone="dark" />
        </div>

        <Link href="/account/sign-in" className="mt-14 text-xs text-white/35 transition hover:text-white/70">
          Staff sign in
        </Link>
      </main>
    </div>
  );
}
