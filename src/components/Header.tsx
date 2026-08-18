"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth";
import { site } from "@/lib/site";

const NAV_LINKS = [
  { href: "/search", label: "Book a Car" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, ready } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-midnight text-white">
      <div className="container-shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size={34} light />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-white/80 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-white/80 transition hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 5c0 8.284 6.716 15 15 15l2-3.5-5-2-1.5 2C11.5 15 9 12.5 8 10.5l2-1.5-2-5L4 5Z" strokeLinejoin="round" />
            </svg>
            {site.phoneDisplay}
          </a>
          <span className="rounded border border-white/15 px-2 py-1 text-xs text-white/70">KES</span>
          <Link
            href="/account"
            className="text-sm font-medium text-white/80 transition hover:text-white"
          >
            {ready && user ? `Hi, ${user.name.split(" ")[0]}` : "Sign In"}
          </Link>
          <Link
            href="/search"
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-midnight shadow-sm transition hover:bg-gold-dark hover:text-white"
          >
            Book Now
          </Link>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-midnight lg:hidden">
          <div className="container-shell flex flex-col gap-4 py-4 text-sm font-medium text-white/85">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/account" onClick={() => setOpen(false)}>
              {ready && user ? `My Account (${user.name.split(" ")[0]})` : "Sign In / Create Account"}
            </Link>
            <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer">
              WhatsApp / Call: {site.phoneDisplay}
            </a>
            <Link
              href="/search"
              className="rounded-md bg-gold px-4 py-2 text-center font-semibold text-midnight"
              onClick={() => setOpen(false)}
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
