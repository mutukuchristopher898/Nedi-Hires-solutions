import Image from "next/image";

// The brand artwork is drawn in hairline strokes — its thinnest lines are ~1.3%
// of the emblem's height — so how small it can go depends on what it sits on.
//
// On a light ground a sub-pixel dark line antialiases towards the background
// and disappears, which is why the emblem needs ~76px of height there. On a
// dark ground the same line antialiases to grey and still reads, so the header
// can run it at 56px. Both numbers were measured, not guessed; the difference
// is the contrast direction, not the artwork.
//
//   LogoEmblem  the arch-and-car mark alone.
//   Logo        emblem plus wordmark — the header and footer lockup.
//   LogoLockup  the full artwork, emblem over NEDI over tagline.

const LOCKUP_ASPECT = 1020 / 726;
const EMBLEM_ASPECT = 620 / 323;

/** The arch-and-car mark on its own. Keep it at 56px or above on dark, 76px on light. */
export function LogoEmblem({
  height = 56,
  light = false,
  priority = false,
  className = "",
}: {
  height?: number;
  light?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={light ? "/logo-emblem-dark.png" : "/logo-emblem.png"}
      alt=""
      aria-hidden="true"
      width={Math.round(height * EMBLEM_ASPECT)}
      height={height}
      priority={priority}
      className={className}
    />
  );
}

/**
 * The full brand artwork. Only use this where it can render at ~180px wide or
 * more — below that the emblem inside it falls under the legible threshold.
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
 * Emblem beside the wordmark — the horizontal arrangement the header and the
 * mobile menu need. The emblem is the real artwork; the wordmark is live type
 * in the same serif, which stays crisp at sizes where lettering rendered as an
 * image would not. The emblem carries no alt text because the wordmark beside
 * it already names the brand.
 */
export default function Logo({
  light = false,
  tagline = false,
  emblemHeight = 56,
}: {
  light?: boolean;
  tagline?: boolean;
  emblemHeight?: number;
}) {
  return (
    <span className="flex items-center gap-3">
      <LogoEmblem light={light} height={emblemHeight} priority />
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
    </span>
  );
}
