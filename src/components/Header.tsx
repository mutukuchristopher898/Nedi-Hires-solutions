"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { site } from "@/lib/site";
import { SERVICE_GROUPS } from "@/lib/services";
import ServiceIcon from "./ServiceIcon";

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
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? "/";

  // The Services menu closes on a click elsewhere, on Escape, and whenever
  // the page changes.
  useEffect(() => {
    if (!servicesOpen) return;
    function onPointer(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setServicesOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setServicesOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen]);

  // A link inside a menu closes it, but so must the browser's Back button.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setServicesOpen(false);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-midnight text-white">
      <div className="container-shell flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${site.name} home`}>
          <Logo light />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-9 text-sm font-medium tracking-wide lg:flex">
          {NAV_LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            const style = `border-b-2 py-1 transition ${
              current ? "border-gold text-white" : "border-transparent text-white/75 hover:text-white"
            }`;
            if (link.href === "/services") {
              return (
                <div key={link.href} ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setServicesOpen((v) => !v)}
                    aria-expanded={servicesOpen}
                    aria-controls="services-menu"
                    className={`flex items-center gap-1 ${style}`}
                  >
                    {link.label}
                    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 transition ${servicesOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {servicesOpen && (
                    <div
                      id="services-menu"
                      className="absolute left-1/2 top-full z-50 mt-4 w-[640px] -translate-x-1/2 rounded-2xl bg-midnight p-6 shadow-2xl ring-1 ring-white/10"
                    >
                      <div className="grid grid-cols-2 gap-8">
                        {SERVICE_GROUPS.map((group) => (
                          <div key={group.title}>
                            <p className="mb-3 text-xs font-medium text-white/45">{group.title}</p>
                            <ul className="space-y-1">
                              {group.services.map((service) => (
                                <li key={service.slug}>
                                  <Link
                                    href={`/services/${service.slug}`}
                                    onClick={() => setServicesOpen(false)}
                                    aria-current={pathname === `/services/${service.slug}` ? "page" : undefined}
                                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-white/80 transition hover:bg-white/5 hover:text-white"
                                  >
                                    <ServiceIcon name={service.title} className="h-4 w-4 shrink-0 text-gold" />
                                    {service.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 border-t border-white/10 pt-4">
                        <Link
                          href="/services"
                          onClick={() => setServicesOpen(false)}
                          className="text-sm font-semibold text-gold transition hover:text-white"
                        >
                          View all services
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined} className={style}>
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
            Book now
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
              if (link.href === "/services") {
                return (
                  <div key={link.href} className="border-b border-white/5">
                    <button
                      type="button"
                      onClick={() => setMobileServicesOpen((v) => !v)}
                      aria-expanded={mobileServicesOpen}
                      className={`flex w-full items-center justify-between py-3 ${current ? "text-gold" : "text-white/85"}`}
                    >
                      {link.label}
                      <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 transition ${mobileServicesOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {mobileServicesOpen && (
                      <ul className="pb-3 pl-3">
                        {SERVICE_GROUPS.flatMap((g) => g.services).map((service) => (
                          <li key={service.slug}>
                            <Link
                              href={`/services/${service.slug}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 py-2 text-white/75"
                            >
                              <ServiceIcon name={service.title} className="h-4 w-4 shrink-0 text-gold" />
                              {service.title}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link href="/services" onClick={() => setOpen(false)} className="block py-2 font-semibold text-gold">
                            View all services
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                );
              }
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
              Book now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
