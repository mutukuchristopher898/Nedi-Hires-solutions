import Image from "next/image";

/**
 * The colourful banner at the top of a page.
 *
 * With a photo: the photo fills the banner behind a teal-to-terracotta tint,
 * which keeps white text readable on any picture. Without one: a sunset sky
 * (deep teal into terracotta, with a gold glow) over a savanna horizon drawn
 * here as original artwork, so the banner looks finished either way.
 */
export default function PageHero({
  image,
  imageAlt = "",
  className = "py-16",
  children,
}: {
  image?: string | null;
  imageAlt?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-teal-dark text-white">
      {image ? (
        <>
          <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="-z-20 object-cover" />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-teal-dark/95 via-teal-dark/75 to-terracotta-dark/45"
          />
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-dark via-teal to-terracotta" />
          <div className="absolute inset-0 [background:radial-gradient(circle_at_82%_78%,rgba(240,180,90,0.55),transparent_32%),radial-gradient(circle_at_10%_0%,rgba(10,66,68,0.6),transparent_55%)]" />
          <svg
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-28 w-full sm:h-36"
          >
            <path d="M0 150 C 240 110 420 135 640 120 C 860 105 1040 140 1240 118 C 1340 108 1400 112 1440 116 L1440 220 L0 220 Z" fill="rgba(27,26,24,0.35)" />
            <path d="M0 185 C 200 160 380 178 600 168 C 820 158 1000 182 1220 170 C 1330 164 1400 168 1440 172 L1440 220 L0 220 Z" fill="rgba(27,26,24,0.55)" />
            {/* An acacia: thin trunk, flat spreading crown. */}
            <g fill="rgba(27,26,24,0.6)">
              <path d="M1118 172 L1124 120 L1129 120 L1131 172 Z" />
              <path d="M1124 124 L1100 108 L1104 104 L1126 118 Z" />
              <path d="M1129 122 L1152 106 L1156 110 L1131 126 Z" />
              <ellipse cx="1126" cy="100" rx="70" ry="13" />
              <ellipse cx="1102" cy="106" rx="34" ry="8" />
              <ellipse cx="1156" cy="105" rx="36" ry="8" />
            </g>
          </svg>
        </div>
      )}
      <div className={`relative ${className}`}>{children}</div>
    </section>
  );
}
