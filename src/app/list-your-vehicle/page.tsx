import { redirect } from "next/navigation";

// The owner landing page became "Partner with us" (/partner), October 2026.
// Old links land there; the self-service sign-up at /list-your-vehicle/start
// is unchanged and linked from the new page.
export default function ListYourVehiclePage() {
  redirect("/partner");
}
