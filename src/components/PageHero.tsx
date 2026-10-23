import Image from "next/image";

/**
 * The banner at the top of a page, in the brand's black and gold.
 *
 * With a photo: the photo fills the banner under a dark shade that is
 * strongest on the left, where the text sits, so white text and gold buttons
 * stay readable on any picture. Without one: the original black background
 * with two soft gold glows.
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
    <section className="relative isolate overflow-hidden bg-midnight text-white">
      {image ? (
        <>
          <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="-z-20 object-cover" />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-r from-midnight/90 via-midnight/70 to-midnight/35"
          />
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-midnight via-charcoal to-charcoal-soft" />
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(182,130,53,0.28),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(143,101,39,0.22),transparent_40%)]" />
        </div>
      )}
      <div className={`relative ${className}`}>{children}</div>
    </section>
  );
}
