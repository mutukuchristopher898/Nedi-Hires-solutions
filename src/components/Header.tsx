"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth";
import { site } from "@/lib/site";

// Top bar. Kept deliberately short: one place to choose a car (Our Fleet),
// Subscriptions left out while that product is unfinished (see
// SUBSCRIPTIONS_ENABLED in src/lib/features.ts), and no personal details:
// the phone number sits behind a Call button and a signed-in customer's name
// is never shown, so it isn't on screen for anyone looking over a shoulder.
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/fleet", label: "Our Fleet" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact us" },
];

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 5c0 8.284 6.716 15 15 15l2-3.5-5-2-1.5 2C11.5 15 9 12.5 8 10.5l2-1.5-2-5L4 5Z" strokeLinejoin="round" />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const { user, ready } = useAuth();
  const accountLabel = ready && user ? "My account" : "Sign in";

  return (
    <header className="sticky top-0 z-50 bg-midnight text-white">
      <div className="container-shell flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${site.name} home`}>
          <Logo light />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {NAV_LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`border-b-2 py-1 transition ${
                  current ? "border-gold text-white" : "border-transparent text-white/75 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={`tel:${site.phoneTel}`}
            aria-label={`Call ${site.name}`}
            className="flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white/90 transition hover:border-white/40 hover:text-white"
          >
            <PhoneIcon />
            Call
          </a>
          <Link
            href="/account"
            className="px-2 text-sm font-medium text-white/80 transition hover:text-white"
          >
            {accountLabel}
          </Link>
          <Link
            href="/fleet"
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-midnight shadow-sm transition hover:bg-gold-dark hover:text-white"
          >
            Book Now
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <a
            href={`tel:${site.phoneTel}`}
            aria-label={`Call ${site.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15"
          >
            <PhoneIcon />
          </a>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-white/10 bg-midnight lg:hidden">
          <div className="container-shell flex flex-col py-3 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const current = isCurrent(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`border-b border-white/5 py-3 ${current ? "text-gold" : "text-white/85"}`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link href="/account" onClick={() => setOpen(false)} className="border-b border-white/5 py-3 text-white/85">
              {accountLabel}
            </Link>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href={`tel:${site.phoneTel}`}
                className="flex items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-2.5 font-semibold text-white"
              >
                <PhoneIcon />
                Call
              </a>
              <Link
                href="/fleet"
                className="rounded-md bg-gold px-4 py-2.5 text-center font-semibold text-midnight"
                onClick={() => setOpen(false)}
              >
                Book Now
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
