import Image from "next/image";

// The brand artwork is a wide lockup — emblem, "NEDI" wordmark and tagline
// stacked — drawn in hairline strokes. Its thinnest lines are ~1.3% of the
// emblem's height, so below roughly 76px of emblem height they fall under one
// device pixel and grey out into an illegible smudge.
//
// So the logo has two forms, and which one you get depends on the space:
//   Logo       — a type-only wordmark for the header, footer and anywhere small.
//   LogoLockup — the real artwork, for places with room to render it properly.
//
// Both dark variants are recoloured from the same master, so the ink matches.

const LOCKUP_ASPECT = 1020 / 726;

/**
 * The full brand artwork. Only use this where it can render at 120px tall or
 * more — below that, reach for `Logo` instead.
 *
 * `light` selects the white-ink variant for dark backgrounds.
 */
export function LogoLockup({
  width = 320,
  light = false,
  priority = false,
  className = "",
}: {
  width?: number;
  light?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={light ? "/logo-lockup-dark.png" : "/logo-lockup.png"}
      alt="Nedi Hires Solutions — Drive. Explore. Experience."
      width={width}
      height={Math.round(width / LOCKUP_ASPECT)}
      priority={priority}
      className={className}
    />
  );
}

/**
 * The wordmark, set in type rather than drawn — crisp at any size and free of
 * image weight. This is what the header and footer use.
 */
export default function Logo({
  light = false,
  tagline = false,
}: {
  light?: boolean;
  tagline?: boolean;
}) {
  return (
    <span className="flex flex-col leading-none">
      <span
        className={`font-serif text-[26px] font-medium tracking-[0.3em] ${
          light ? "text-white" : "text-midnight"
        }`}
      >
        NEDI
      </span>
      {/* The legal name stays visible: the artwork shortens to NEDI, the
          business is still Nedi Hires Solutions. */}
      <span
        className={`mt-1 text-[9px] font-medium uppercase tracking-[0.22em] ${
          light ? "text-white/60" : "text-midnight/60"
        }`}
      >
        Hires Solutions
      </span>
      {tagline && (
        <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
          Drive. Explore. Experience.
        </span>
      )}
    </span>
  );
}
