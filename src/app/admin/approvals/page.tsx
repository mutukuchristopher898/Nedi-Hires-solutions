import { redirect } from "next/navigation";

// The approval queue folded into the Vehicles section, which shows every
// lifecycle state rather than only pending. Kept as a redirect so existing
// links and bookmarks still land somewhere sensible.
export default function AdminApprovalsPage() {
  redirect("/admin/vehicles?status=pending");
}
