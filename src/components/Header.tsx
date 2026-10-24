"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import ServiceIcon from "./ServiceIcon";
import { site } from "@/lib/site";
import { SERVICE_GROUPS } from "@/lib/services";
import { FLEET_CLASSES, fleetAnchor } from "@/lib/fleetClasses";

// Top bar: logo, five links (Our Fleet and Services open menus), a discreet
// account icon and one call to action. Subscriptions is left out while
// unfinished (SUBSCRIPTIONS_ENABLED in src/lib/features.ts); phone, WhatsApp
// and email live in the footer.

type MenuId = "fleet" | "services";

const NAV_LINKS: { href: string; label: string; menu?: MenuId }[] = [
  { href: "/", label: "Home" },
  { href: "/fleet", label: "Our Fleet", menu: "fleet" },
  { href: "/services", label: "Services", menu: "services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact us" },
];

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c.9-3.4 3.7-5.5 7-5.5s6.1 2.1 7 5.5" strokeLinecap="round" />
    </svg>
  );
}

const accountClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 text-gold transition hover:border-gold hover:bg-gold hover:text-midnight";

function FleetMenuItems({ onPick }: { onPick: () => void }) {
  return (
    <ul className="space-y-1">
      {FLEET_CLASSES.map((c) => (
        <li key={c.classification}>
          <Link
            href={`/fleet#${fleetAnchor(c.title)}`}
            onClick={onPick}
            className="block rounded-lg px-3 py-2.5 transition hover:bg-white/5"
          >
            <span className="block text-sm font-medium text-white">{c.title}</span>
            <span className="mt-0.5 block text-xs text-white/50">{c.blurb}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [mobileMenu, setMobileMenu] = useState<MenuId | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname() ?? "/";

  // An open menu closes on a click outside the menu bar, or on Escape.
  useEffect(() => {
    if (!openMenu) return;
    function onPointer(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  // ...and whenever the page changes, including via the Back button.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  const close = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-midnight text-white">
      <div className="container-shell flex h-20 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${site.name} home`}>
          <Logo light />
        </Link>

        <nav ref={navRef} aria-label="Main" className="hidden items-center gap-9 text-sm font-medium tracking-wide lg:flex">
          {NAV_LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            const style = `border-b-2 py-1 transition ${
              current ? "border-gold text-white" : "border-transparent text-white/75 hover:text-white"
            }`;
            if (!link.menu) {
              return (
                <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined} className={style}>
                  {link.label}
                </Link>
              );
            }
            const isOpen = openMenu === link.menu;
            return (
              <div key={link.href} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu(isOpen ? null : link.menu!)}
                  aria-expanded={isOpen}
                  aria-controls={`${link.menu}-menu`}
                  className={`flex items-center gap-1 ${style}`}
                >
                  {link.label}
                  <Chevron open={isOpen} />
                </button>

                {isOpen && link.menu === "fleet" && (
                  <div id="fleet-menu" className="absolute left-1/2 top-full z-50 mt-4 w-[380px] -translate-x-1/2 rounded-2xl bg-midnight p-4 shadow-2xl ring-1 ring-white/10">
                    <FleetMenuItems onPick={close} />
                    <div className="mt-3 border-t border-white/10 px-3 pt-3">
                      <Link href="/fleet" onClick={close} className="text-sm font-semibold text-gold transition hover:text-white">
                        View the full fleet
                      </Link>
                    </div>
                  </div>
                )}

                {isOpen && link.menu === "services" && (
                  <div id="services-menu" className="absolute left-1/2 top-full z-50 mt-4 w-[640px] -translate-x-1/2 rounded-2xl bg-midnight p-6 shadow-2xl ring-1 ring-white/10">
                    <div className="grid grid-cols-2 gap-8">
                      {SERVICE_GROUPS.map((group) => (
                        <div key={group.title}>
                          <p className="mb-3 text-xs font-medium text-white/45">{group.title}</p>
                          <ul className="space-y-1">
                            {group.services.map((service) => (
                              <li key={service.slug}>
                                <Link
                                  href={`/services/${service.slug}`}
                                  onClick={close}
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
                      <Link href="/services" onClick={close} className="text-sm font-semibold text-gold transition hover:text-white">
                        View all services
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/account" aria-label="My account" title="My account" className={accountClass}>
            <AccountIcon />
          </Link>
          <Link
            href="/fleet"
            className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-midnight shadow-sm transition hover:bg-gold-dark hover:text-white"
          >
            Book now
          </Link>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Link href="/account" aria-label="My account" className={accountClass}>
            <AccountIcon />
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Main" className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-white/10 bg-midnight lg:hidden">
          <div className="container-shell flex flex-col py-3 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const current = isCurrent(pathname, link.href);
              if (!link.menu) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    onClick={close}
                    className={`border-b border-white/5 py-3 ${current ? "text-gold" : "text-white/85"}`}
                  >
                    {link.label}
                  </Link>
                );
              }
              const isOpen = mobileMenu === link.menu;
              return (
                <div key={link.href} className="border-b border-white/5">
                  <button
                    type="button"
                    onClick={() => setMobileMenu(isOpen ? null : link.menu!)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center justify-between py-3 ${current ? "text-gold" : "text-white/85"}`}
                  >
                    {link.label}
                    <Chevron open={isOpen} />
                  </button>
                  {isOpen && link.menu === "fleet" && (
                    <ul className="pb-3 pl-3">
                      {FLEET_CLASSES.map((c) => (
                        <li key={c.classification}>
                          <Link href={`/fleet#${fleetAnchor(c.title)}`} onClick={close} className="block py-2 text-white/75">
                            {c.title}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href="/fleet" onClick={close} className="block py-2 font-semibold text-gold">
                          View the full fleet
                        </Link>
                      </li>
                    </ul>
                  )}
                  {isOpen && link.menu === "services" && (
                    <ul className="pb-3 pl-3">
                      {SERVICE_GROUPS.flatMap((g) => g.services).map((service) => (
                        <li key={service.slug}>
                          <Link href={`/services/${service.slug}`} onClick={close} className="flex items-center gap-3 py-2 text-white/75">
                            <ServiceIcon name={service.title} className="h-4 w-4 shrink-0 text-gold" />
                            {service.title}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href="/services" onClick={close} className="block py-2 font-semibold text-gold">
                          View all services
                        </Link>
                      </li>
                    </ul>
                  )}
                </div>
              );
            })}
            <Link href="/fleet" className="mt-4 rounded-md bg-gold px-4 py-3 text-center font-semibold text-midnight" onClick={close}>
              Book now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
