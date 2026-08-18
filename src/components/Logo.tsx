import Image from "next/image";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-mark.png"
        alt="Nedi Hires Solutions"
        width={size * 2}
        height={size * 2}
        className="h-full w-full object-cover"
        priority
      />
    </span>
  );
}

export default function Logo({
  size = 36,
  light = false,
  tagline = false,
}: {
  size?: number;
  light?: boolean;
  tagline?: boolean;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="flex flex-col leading-tight">
        <span className={`font-bold tracking-tight ${light ? "text-white" : "text-midnight"}`}>
          Nedi Hires <span className="text-gold">Solutions</span>
        </span>
        {tagline && (
          <span
            className={`text-[11px] font-medium uppercase tracking-wide ${
              light ? "text-white/50" : "text-midnight/50"
            }`}
          >
            Drive. Explore. Experience Kenya.
          </span>
        )}
      </span>
    </span>
  );
}
