import Link from "next/link";
import Image from "next/image";
import { sourceableFor, FLEET } from "@/lib/fleetCatalog";

/**
 * The models we can obtain, shown under whatever search actually returned.
 *
 * Two vehicles in stock is a thin answer to "what can I hire", and an empty
 * result page is no answer at all. "We don't have one listed, but we can get
 * you these" is both true and more use.
 *
 * Deliberately below the real results and visually distinct from them. These
 * carry no price and no Book button, because nothing here is a car sitting
 * ready — conflating the two is the mistake the illustrative catalogue made.
 */
export default function SourceableFleet({ classification }: { classification?: string }) {
  const matches = sourceableFor(classification, 8);
  if (matches.length === 0) return null;

  return (
    <section className="mt-12 border-t border-line pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-midnight">We can also source these</h2>
          <p className="mt-1 max-w-xl text-sm text-midnight/60">
            Not listed as available right now, but we can get hold of them. Tell us your dates and
            we&apos;ll come back with a price.
          </p>
        </div>
        <Link href="/fleet" className="text-sm font-semibold text-gold-dark hover:text-gold">
          All {FLEET.length} models &rarr;
        </Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {matches.map((v) => (
          <Link
            key={v.slug}
            href={`/contact?vehicle=${encodeURIComponent(`${v.make} ${v.model}`)}`}
            className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition hover:ring-gold"
          >
            {v.image ? (
              <Image
                src={v.image}
                alt={`${v.make} ${v.model}`}
                width={900}
                height={600}
                className="h-32 w-full object-cover transition group-hover:opacity-90"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-midnight to-charcoal-soft">
                <span className="px-3 text-center text-xs font-medium uppercase tracking-wide text-white/50">
                  {v.make}
                </span>
              </div>
            )}
            <div className="flex flex-1 flex-col p-3">
              <h3 className="text-sm font-semibold text-midnight">
                {v.make} {v.model}
              </h3>
              <p className="mt-0.5 text-xs text-midnight/60">{v.seats} seats</p>
              <span className="mt-auto pt-2 text-xs font-semibold text-gold-dark">
                Request a quote &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
