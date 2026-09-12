import Image from "next/image";
import { publicVehiclePhotoUrl } from "@/lib/supabase/vehiclePhotos";

const GRADIENTS: Record<string, string> = {
  econ: "from-[#12a575] to-[#1b1a18]",
  suv: "from-[#1b1a18] to-[#34312b]",
  luxury: "from-[#1b1a18] to-[#3a3f47]",
  bus: "from-[#8f6527] to-[#1b1a18]",
  van: "from-[#b68235] to-[#262420]",
};

function VehicleGlyph({ image }: { image: string }) {
  if (image === "bus" || image === "van") {
    return (
      <svg viewBox="0 0 64 40" className="h-10 w-16 text-white/85" fill="none">
        <rect x="3" y="8" width="58" height="20" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <path d="M3 18 H61" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="30" r="4" fill="currentColor" />
        <circle cx="48" cy="30" r="4" fill="currentColor" />
      </svg>
    );
  }
  if (image === "suv") {
    return (
      <svg viewBox="0 0 64 32" className="h-9 w-16 text-white/85" fill="none">
        <path
          d="M6 22 L10 11 Q13 7 20 7 H42 Q49 7 52 11 L58 22"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M4 22 H60" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="18" cy="24" r="4.5" fill="currentColor" />
        <circle cx="46" cy="24" r="4.5" fill="currentColor" />
      </svg>
    );
  }
  if (image === "luxury") {
    return (
      <svg viewBox="0 0 64 28" className="h-8 w-16 text-white/85" fill="none">
        <path
          d="M4 20 L9 12 Q14 8 22 8 H40 Q47 8 51 12 L59 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M2 20 H62" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="17" cy="21.5" r="4" fill="currentColor" />
        <circle cx="47" cy="21.5" r="4" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 28" className="h-8 w-16 text-white/85" fill="none">
      <path
        d="M6 20 L11 12 Q14 9 20 9 H38 Q44 9 47 12 L54 20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M4 20 H58" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="17" cy="21.5" r="4" fill="currentColor" />
      <circle cx="45" cy="21.5" r="4" fill="currentColor" />
    </svg>
  );
}

/**
 * A real photograph when the listing has one, the class gradient when it
 * doesn't. Partner listings can't be approved without a photo, so the
 * gradient is now only reached by the seeded illustrative rows — it stays as
 * the fallback rather than leaving a hole if a photo ever fails to load.
 */
export default function VehiclePhoto({
  image,
  photoPath,
  alt = "",
  sizes,
  className = "",
}: {
  image: string;
  photoPath?: string;
  alt?: string;
  sizes?: string;
  className?: string;
}) {
  if (photoPath) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={publicVehiclePhotoUrl(photoPath)}
          alt={alt}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
          className="object-cover"
        />
      </div>
    );
  }

  const gradient = GRADIENTS[image] ?? GRADIENTS.econ;
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
    >
      <VehicleGlyph image={image} />
    </div>
  );
}
