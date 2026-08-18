import type { ApprovalStatus } from "@/lib/types";

const STYLES: Record<ApprovalStatus, string> = {
  approved: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
};

const LABELS: Record<ApprovalStatus, string> = {
  approved: "Approved",
  pending: "Pending Review",
  rejected: "Rejected",
};

export default function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
