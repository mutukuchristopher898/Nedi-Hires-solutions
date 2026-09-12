import StatusBadge from "@/components/StatusBadge";
import DocumentPreview from "@/components/admin/DocumentPreview";
import DocumentReviewActions from "@/components/admin/DocumentReviewActions";
import { getPendingDocuments } from "@/lib/supabase/queries";
import { requireRole } from "@/lib/supabase/authz";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminDocumentsPage() {
  // The layout already guards this route; called again here for the reviewer
  // id, which is recorded against each decision.
  const { userId } = await requireRole(["admin"], "/admin/documents");
  const documents = await getPendingDocuments();

  const pendingCount = documents.filter((d) => d.status === "pending").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Identity Verification Queue</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Real customer documents submitted during the booking flow. Validating or rejecting one
        is recorded against your account.
      </p>

      {documents.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">No documents have been submitted yet.</p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-midnight/60">
            {pendingCount} awaiting review · {documents.length} total
          </p>

          <div className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
            <table className="w-full text-sm">
              <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-midnight/50">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Booking Ref</th>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">View</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-5 py-3 font-medium text-midnight">
                      {doc.customerName ?? <span className="text-midnight/40">Name not on file</span>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-midnight/70">{doc.bookingRef ?? "—"}</td>
                    <td className="px-5 py-3 text-midnight/70">{doc.docType}</td>
                    <td className="px-5 py-3">
                      <DocumentPreview signedUrl={doc.signedUrl} path={doc.fileUrl} docType={doc.docType} />
                    </td>
                    <td className="px-5 py-3 text-midnight/70">{formatDate(doc.submittedAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-3">
                      <DocumentReviewActions documentId={doc.id} status={doc.status} reviewerId={userId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
