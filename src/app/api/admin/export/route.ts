import { createClient } from "@/lib/supabase/server";
import { csvResponse, toCsv } from "@/lib/csv";
import {
  getAdminVehicles,
  getAdminAccounts,
  getAdminBookings,
  getAuditLog,
  type VehicleLifecycle,
} from "@/lib/supabase/queries";
import { classifications } from "@/lib/data";

// Exports run the same filtered query the screen ran, without pagination, so
// the file matches what the operator is looking at. Exporting only the current
// page would be the surprising behaviour — nobody wants page 3 of their data.

const LIFECYCLES: VehicleLifecycle[] = ["pending", "live", "hidden", "rejected", "archived"];

// A ceiling, so an export cannot become a way to pull the whole database in
// one request, or to time out a serverless function trying.
const MAX_ROWS = 5000;

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  // RLS would refuse the rows anyway; this returns an honest status instead of
  // an empty file, which looks like "there is no data" rather than "no".
  const { data: actor } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const role = (actor as { role?: string } | null)?.role;
  if (role !== "admin" && role !== "staff") {
    return Response.json({ error: "Not permitted" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");

  if (entity === "vehicles") {
    const lifecycle = LIFECYCLES.includes(searchParams.get("status") as VehicleLifecycle)
      ? (searchParams.get("status") as VehicleLifecycle)
      : undefined;
    const classification = classifications.includes(
      searchParams.get("class") as (typeof classifications)[number]
    )
      ? searchParams.get("class") ?? undefined
      : undefined;

    const { vehicles } = await getAdminVehicles({
      lifecycle,
      partnerName: searchParams.get("partner") ?? undefined,
      location: searchParams.get("location") ?? undefined,
      classification,
      search: (searchParams.get("q") ?? "").slice(0, 80).trim() || undefined,
      page: 1,
      limit: MAX_ROWS,
    });

    return csvResponse(
      `nedi-vehicles-${stamp()}.csv`,
      toCsv(
        ["Registration", "Make", "Model", "Year", "Class", "Transmission", "Fuel",
         "Seats", "Location", "Daily rate (USD)", "Partner", "Status", "Photos", "Listed"],
        vehicles.map((v) => [
          v.licensePlate, v.make, v.model, v.year, v.classification, v.transmission,
          v.fuelType, v.capacity, v.location, v.pricePerDay, v.partnerName ?? "",
          v.lifecycle, v.photoPaths.length, v.createdAt.slice(0, 10),
        ])
      )
    );
  }

  if (entity === "accounts") {
    const accounts = await getAdminAccounts();
    return csvResponse(
      `nedi-accounts-${stamp()}.csv`,
      toCsv(
        ["Name", "Email", "Phone", "Role", "Partner", "Bookings", "Joined", "Suspended", "Erased"],
        accounts.map((a) => [
          a.fullName, a.email ?? "", a.phone ?? "", a.role, a.partnerName ?? "",
          a.bookingCount, a.createdAt.slice(0, 10),
          a.suspendedAt ? a.suspendedAt.slice(0, 10) : "",
          a.anonymisedAt ? a.anonymisedAt.slice(0, 10) : "",
        ])
      )
    );
  }

  if (entity === "bookings") {
    const bookings = await getAdminBookings();
    return csvResponse(
      `nedi-bookings-${stamp()}.csv`,
      toCsv(
        ["Reference", "Status", "Customer", "Vehicle", "Registration", "From", "To",
         "Total", "Currency", "Holding vehicle", "Created"],
        bookings.map((b) => [
          b.bookingRef, b.status, b.customerName ?? "", b.vehicleLabel, b.licensePlate,
          b.startDate, b.endDate, b.totalAmount, b.currency,
          b.holdsVehicle ? "yes" : "no", b.createdAt.slice(0, 10),
        ])
      )
    );
  }

  if (entity === "audit") {
    const { entries } = await getAuditLog({
      entityType: searchParams.get("entityType") ?? undefined,
      page: 1,
      limit: 200,
    });

    return csvResponse(
      `nedi-activity-${stamp()}.csv`,
      toCsv(
        ["When", "Actor", "Role", "Action", "Record type", "Record", "Fields changed"],
        entries.map((e) => [
          e.createdAt, e.actorEmail ?? "", e.actorRole ?? "", e.action,
          e.entityType, e.entityId ?? "",
          // The field names, not the values: an export that lands in a
          // spreadsheet should not carry ID numbers out of the system.
          Object.keys(e.changes).join(" "),
        ])
      )
    );
  }

  return Response.json({ error: "Unknown export" }, { status: 400 });
}
