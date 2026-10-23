"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { site } from "@/lib/site";

// Top bar. Deliberately minimal: logo, five links, one call to action.
// Subscriptions is left out while unfinished (SUBSCRIPTIONS_ENABLED in
// src/lib/features.ts). Sign in / My account lives in the footer, and the
// booking flow sends people to sign in when they need to; phone, WhatsApp
// and email are in the footer too.
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

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-50 bg-midnight text-white">
      <div className="container-shell flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${site.name} home`}>
          <Logo light />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-9 text-sm font-medium tracking-wide lg:flex">
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

        <div className="hidden lg:block">
          <Link
            href="/fleet"
            className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-midnight shadow-sm transition hover:bg-gold-dark hover:text-white"
          >
            Book Now
          </Link>
        </div>

        <div className="flex items-center lg:hidden">
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
            <Link
              href="/fleet"
              className="mt-4 rounded-md bg-gold px-4 py-3 text-center font-semibold text-midnight"
              onClick={() => setOpen(false)}
            >
              Book Now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
