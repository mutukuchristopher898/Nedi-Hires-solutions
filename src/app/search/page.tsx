import { redirect } from "next/navigation";

// "Book a Car" used to be its own page here, listing the same vehicles as Our
// Fleet a second way. The two were merged (October 2026) so there is one
// place to choose a car. Old links, bookmarks and search results land on Our
// Fleet instead, at the right section when they asked for a vehicle type.

const SECTION_FOR_CLASS: Record<string, string> = {
  Economy: "economy",
  Luxury: "executive-luxury",
  SUV: "suvs-4x4s-pickups",
  "Road-Trip Van": "vans-people-carriers",
  Bus: "buses",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ classification?: string | string[] }>;
}) {
  const { classification } = await searchParams;
  const section = typeof classification === "string" ? SECTION_FOR_CLASS[classification] : undefined;
  redirect(section ? `/fleet#${section}` : "/fleet");
}
