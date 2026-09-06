import Link from "next/link";

// Without this, a mistyped URL — or a delisted vehicle, since
// vehicles/[id]/page.tsx and booking/[id]/layout.tsx both call notFound()
// deliberately — dropped the visitor on Next.js's bare white page with no
// header, footer or way back.
export default function NotFound() {
  return (
    <div className="container-shell py-20">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold-dark">Page not found</p>
        <h1 className="mt-3 text-3xl font-bold text-midnight">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-sm text-midnight/60">
          The link may be out of date, or the vehicle may no longer be available to book. Our
          fleet changes as vehicles are added and retired.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/search"
            className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
          >
            Browse available vehicles
          </Link>
          <Link
            href="/"
            className="rounded-md border border-line px-6 py-3 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
          >
            Back to home
          </Link>
        </div>

        <p className="mt-8 text-sm text-midnight/50">
          Still stuck?{" "}
          <Link href="/contact" className="font-medium text-gold-dark hover:text-gold">
            Get in touch
          </Link>{" "}
          and we&apos;ll help you find what you need.
        </p>
      </div>
    </div>
  );
}
