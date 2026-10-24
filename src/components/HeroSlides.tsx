"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Banner slideshow: shows each photo for 7 seconds, cross-fading over 1.5s,
// for any number of photos. The first photo loads with the page; the rest
// load straight after. Visitors who have asked their device to reduce motion
// see the first photo only.

const SLIDE_MS = 7000;

export default function HeroSlides({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setCurrent((i) => (i + 1) % images.length), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [images.length]);

  return (
    <div aria-hidden="true" className="hero-zoom absolute inset-0 -z-20">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="100vw"
          priority={i === 0}
          fetchPriority={i === 0 ? "high" : "low"}
          className={`object-cover transition-opacity duration-[1500ms] ease-in-out ${i === current ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
