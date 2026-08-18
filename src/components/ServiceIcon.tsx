const ICONS: Record<string, React.ReactNode> = {
  "Self-Drive": (
    <>
      <path d="M4 15l1.5-5A3 3 0 0 1 8.4 8h7.2a3 3 0 0 1 2.9 2l1.5 5" />
      <rect x="3" y="15" width="18" height="5" rx="1.5" />
      <circle cx="7.5" cy="20" r="1" />
      <circle cx="16.5" cy="20" r="1" />
    </>
  ),
  "Chauffeur-Driven": (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
      <path d="M9 9.5c0 1.5 3 1.5 6 0" />
    </>
  ),
  "Airport Transfers": (
    <path d="M10.5 3.5 12 2l1.5 1.5-1 3.6 5.4 3.1c.6.3.9 1 .7 1.7l-.2.6-6.3-1.2-1.3 3.6 1.7 1.1-.3 1-4-.6-1.3-3.8L3 12.6l.4-1 6.1 1.3 1.3-3.6-1-3.6z" />
  ),
  "Corporate Travel": (
    <>
      <rect x="3.5" y="8" width="17" height="11" rx="1.5" />
      <path d="M8.5 8V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v2" />
      <path d="M3.5 13h17" />
    </>
  ),
  "Family Trips": (
    <>
      <circle cx="8" cy="7" r="2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M3.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5" />
      <path d="M11.5 19c0-2.6 1.8-4.5 4.5-4.5s4.5 1.9 4.5 4.5" />
    </>
  ),
  "Tours & Safaris": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
    </>
  ),
  "Event Transport": (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M8 3v3M16 3v3" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="12" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
    </>
  ),
};

export default function ServiceIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const icon = ICONS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon}
    </svg>
  );
}
