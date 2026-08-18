import Link from "next/link";
import Logo from "./Logo";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-midnight text-white/70">
      <div className="container-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo size={34} light tagline />
          <p className="mt-4 max-w-xs text-sm">{site.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Rent a Vehicle</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/search">Search Fleet</Link></li>
            <li><Link href="/subscriptions">Mobility Subscriptions</Link></li>
            <li><Link href="/search?classification=Luxury">Chauffeur-Driven</Link></li>
            <li><Link href="/search?classification=Bus">Tours & Safaris</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Company</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact Support</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/partners">Become a Partner</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Get in Touch</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer">
                WhatsApp: {site.phoneDisplay}
              </a>
            </li>
            <li><a href={`tel:${site.phoneTel}`}>Call: {site.phoneDisplay}</a></li>
            <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
            <li>{site.location}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container-shell flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {site.name}. All rights reserved. ·{" "}
            <Link href="/terms" className="underline hover:text-white">Terms</Link> ·{" "}
            <Link href="/privacy" className="underline hover:text-white">Privacy</Link> ·{" "}
            <Link href="/admin" className="underline hover:text-white">Admin Console</Link>
          </span>
          <span>KES · USD · EUR · GBP</span>
        </div>
      </div>
    </footer>
  );
}
