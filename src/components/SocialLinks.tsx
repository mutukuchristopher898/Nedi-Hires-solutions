import { site } from "@/lib/site";

// The business's social profiles as simple text links. Text rather than
// copied brand logos: clear, accessible, and nothing to keep in step with
// each platform's artwork. The list lives in src/lib/site.ts.

export default function SocialLinks({ tone = "light" }: { tone?: "light" | "dark" }) {
  if (site.socials.length === 0) return null;
  const style =
    tone === "dark"
      ? "border-white/15 text-white/80 hover:border-gold hover:text-gold"
      : "border-line text-midnight/75 hover:border-gold hover:text-gold-dark";

  return (
    <ul className="flex flex-wrap gap-2">
      {site.socials.map((s) => (
        <li key={s.name}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${site.name} on ${s.name} (opens in a new tab)`}
            className={`inline-block rounded-full border px-3 py-1 text-xs font-medium transition ${style}`}
          >
            {s.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
