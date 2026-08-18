import { testimonials } from "@/lib/data";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${i < rating ? "fill-gold" : "fill-midnight/15"}`}
        >
          <path d="M10 1.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L10 15l-5.5 3 1.4-6.1-4.7-4.1 6.2-.6L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {testimonials.map((t) => (
        <figure key={t.name} className="flex flex-col rounded-xl bg-white p-5 ring-1 ring-line">
          <Stars rating={t.rating} />
          <blockquote className="mt-3 flex-1 text-sm text-midnight/70">&ldquo;{t.quote}&rdquo;</blockquote>
          <figcaption className="mt-4 border-t border-line pt-3">
            <div className="text-sm font-semibold text-midnight">{t.name}</div>
            <div className="text-xs text-midnight/50">{t.segment}</div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
