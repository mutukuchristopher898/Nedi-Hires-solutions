import Link from "next/link";
import { LogoLockup } from "./Logo";
import { site } from "@/lib/site";
import SocialLinks from "@/components/SocialLinks";

export default function Footer() {
  return (
    <footer className="bg-midnight text-white/70">
      <div className="container-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <LogoLockup light width={260} />
          <p className="mt-4 max-w-xs text-sm">{site.description}</p>
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-white">Follow us</p>
            <SocialLinks tone="dark" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Rent a Vehicle</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/fleet">Our Fleet</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Company</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/partner">Partner with us</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact us</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/account">My account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Reach us</h4>
          {/* Three one-tap buttons. The number and address sit behind them
              (each link and its accessible name carry them), rather than
              being printed in full. All three share the brand's gold ring;
              WhatsApp uses a plain chat icon, not WhatsApp's own logo. */}
          <ul className="mt-4 flex gap-5">
            <li>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp us on ${site.phoneDisplay}`}
                title={`WhatsApp ${site.phoneDisplay}`}
                className="group flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold transition group-hover:border-gold group-hover:bg-gold group-hover:text-midnight">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z" />
                  </svg>
                </span>
                <span className="text-xs text-white/70 group-hover:text-white">WhatsApp</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:${site.phoneTel}`}
                aria-label={`Call us on ${site.phoneDisplay}`}
                title={`Call ${site.phoneDisplay}`}
                className="group flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold transition group-hover:border-gold group-hover:bg-gold group-hover:text-midnight">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 5c0 8.284 6.716 15 15 15l2-3.5-5-2-1.5 2C11.5 15 9 12.5 8 10.5l2-1.5-2-5L4 5Z" />
                  </svg>
                </span>
                <span className="text-xs text-white/70 group-hover:text-white">Call</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                aria-label={`Email us at ${site.email}`}
                title={site.email}
                className="group flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold transition group-hover:border-gold group-hover:bg-gold group-hover:text-midnight">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <span className="text-xs text-white/70 group-hover:text-white">Email</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container-shell flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {site.name}. All rights reserved. ·{" "}
            <Link href="/terms" className="underline hover:text-white">Terms</Link> ·{" "}
            <Link href="/privacy" className="underline hover:text-white">Privacy</Link>
          </span>
          <span>
            Wherever you&apos;re headed, <span className="italic text-gold">twende.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
