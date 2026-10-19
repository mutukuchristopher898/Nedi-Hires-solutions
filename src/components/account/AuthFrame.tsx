import { LogoLockup } from "@/components/Logo";
import { site } from "@/lib/site";

// The frame around sign in, create account and the password reset pages.
// On a phone it is just the form; on a wider screen a brand panel sits beside
// it with three plain facts about how the account is protected. Each fact is
// something the site actually does, so keep them true if that changes.

const FACTS = [
  {
    title: "Your documents stay private",
    body: "ID and licence uploads are stored securely and only seen by our verification staff.",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  {
    title: "Protected sign in",
    body: "Strong passwords are required, and passwords exposed in known data breaches are refused.",
    icon: <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />,
  },
  {
    title: "Real people when you need help",
    body: "Message us on WhatsApp about a booking, an account or anything else.",
    icon: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z" />,
  },
];

export default function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden bg-midnight px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <LogoLockup light width={220} />
          <p className="mt-10 max-w-sm font-serif text-3xl leading-snug">
            Car hire across Kenya, booked and managed in one place.
          </p>
          <ul className="mt-10 max-w-sm space-y-6">
            {FACTS.map((fact) => (
              <li key={fact.title} className="flex gap-4">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 fill-none stroke-gold"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {fact.icon}
                </svg>
                <div>
                  <p className="text-sm font-semibold">{fact.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{fact.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <a
          href={site.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-12 text-sm text-white/60 transition hover:text-gold"
        >
          Need help? Message us on WhatsApp
        </a>
      </aside>

      <div className="flex justify-center lg:items-center lg:py-10">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
