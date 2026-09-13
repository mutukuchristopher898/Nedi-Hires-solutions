// What each role may do, in one place.
//
// This governs rendering only. Every one of these is also enforced in the
// database by is_staff() or is_admin() — hiding a button is not access
// control, and a staff member who forges a request still gets refused by RLS.

export type AdminRole = "staff" | "admin";

export interface AdminCapabilities {
  approveVehicles: boolean;
  hideVehicles: boolean;
  editVehicles: boolean;
  reviewDocuments: boolean;
  replyToEnquiries: boolean;
  viewAccounts: boolean;
  /** Suspending, deleting, changing a role. */
  manageAccounts: boolean;
  /** Platform defaults, per-vehicle overrides, one-way fees. */
  managePricing: boolean;
  cancelBookings: boolean;
  viewAuditLog: boolean;
}

export function capabilitiesFor(role: AdminRole): AdminCapabilities {
  const isAdmin = role === "admin";

  return {
    approveVehicles: true,
    hideVehicles: true,
    editVehicles: true,
    reviewDocuments: true,
    replyToEnquiries: true,
    viewAccounts: true,
    viewAuditLog: true,

    // Admin-only: these move money, end access, or are irreversible.
    manageAccounts: isAdmin,
    managePricing: isAdmin,
    cancelBookings: isAdmin,
  };
}
