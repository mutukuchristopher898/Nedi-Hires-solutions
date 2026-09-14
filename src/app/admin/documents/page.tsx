import DocumentPreview from "@/components/admin/DocumentPreview";
import DocumentReviewActions from "@/components/admin/DocumentReviewActions";
import { requireRole } from "@/lib/supabase/authz";
import { getPendingDocuments, getOptions } from "@/lib/supabase/queries";
import type { DocumentStatus } from "@/lib/types";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  approved: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
  returned: "bg-charcoal-soft/10 text-charcoal-soft ring-1 ring-charcoal-soft/30",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned to customer",
};

const EXPIRY_WARNING_DAYS = 30;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(date: string): number {
  const then = new Date(`${date}T00:00:00Z`).getTime();
  const now = new Date().setUTCHours(0, 0, 0, 0);
  return Math.round((then - now) / 86_400_000);
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["staff", "admin"], "/admin/documents");
  const params = await searchParams;

  const [documents, reasons] = await Promise.all([
    getPendingDocuments(),
    getOptions("document_rejection_reason"),
  ]);

  const filter = (["pending", "approved", "rejected", "returned"] as DocumentStatus[]).includes(
    params.status as DocumentStatus
  )
    ? (params.status as DocumentStatus)
    : undefined;

  const shown = filter ? documents.filter((d) => d.status === filter) : documents;

  const counts = {
    pending: documents.filter((d) => d.status === "pending").length,
    returned: documents.filter((d) => d.status === "returned").length,
  };

  // An approved document that expires next month is a booking that will fail
  // at handover unless somebody notices now.
  const expiringSoon = documents.filter(
    (d) =>
      d.status === "approved" &&
      d.expiresAt &&
      daysUntil(d.expiresAt) <= EXPIRY_WARNING_DAYS &&
      daysUntil(d.expiresAt) >= 0
  );
  const expired = documents.filter(
    (d) => d.status === "approved" && d.expiresAt && daysUntil(d.expiresAt) < 0
  );

  // No sending domain yet, so reasons are recorded and shown to the customer
  // on their account rather than emailed. The review screens say so rather
  // than implying a message went out.
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Identity Verification</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Documents customers submitted during booking. Returning one lets them upload a better copy;
        rejecting is a decision about the document itself. Both need a reason the customer can act
        on.
      </p>

      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="mt-4 rounded-md bg-amber/10 px-4 py-3 text-sm text-amber">
          {expired.length > 0 && (
            <p>
              <strong>{expired.length}</strong> approved document
              {expired.length === 1 ? " has" : "s have"} expired.
            </p>
          )}
          {expiringSoon.length > 0 && (
            <p className={expired.length > 0 ? "mt-1" : ""}>
              <strong>{expiringSoon.length}</strong> expire
              {expiringSoon.length === 1 ? "s" : ""} within {EXPIRY_WARNING_DAYS} days.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        <FilterChip label="All" href="/admin/documents" active={!filter} />
        {(["pending", "returned", "approved", "rejected"] as DocumentStatus[]).map((s) => (
          <FilterChip
            key={s}
            label={`${STATUS_LABELS[s]}${s === "pending" && counts.pending ? ` (${counts.pending})` : ""}${s === "returned" && counts.returned ? ` (${counts.returned})` : ""}`}
            href={`/admin/documents?status=${s}`}
            active={filter === s}
          />
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">
            {documents.length === 0
              ? "No documents have been submitted yet."
              : "Nothing in this state."}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-midnight/60">
            {shown.length} document{shown.length === 1 ? "" : "s"}
          </p>

          <div className="mt-4 space-y-4">
            {shown.map((doc) => {
              const expiresIn = doc.expiresAt ? daysUntil(doc.expiresAt) : null;

              return (
                <article key={doc.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
                  <div className="grid gap-4 lg:grid-cols-[16rem_1fr_16rem]">
                    <DocumentPreview signedUrl={doc.signedUrl} path={doc.fileUrl} docType={doc.docType} />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-midnight">{doc.docType}</h2>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[doc.status]}`}>
                          {STATUS_LABELS[doc.status]}
                        </span>
                        {expiresIn !== null && expiresIn < 0 && (
                          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-500/30">
                            expired
                          </span>
                        )}
                        {expiresIn !== null && expiresIn >= 0 && expiresIn <= EXPIRY_WARNING_DAYS && (
                          <span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-medium text-amber ring-1 ring-amber/30">
                            expires in {expiresIn} day{expiresIn === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-midnight/70">
                        {doc.customerName ?? <span className="text-midnight/40">Name not on file</span>}
                        {doc.bookingRef ? ` · ${doc.bookingRef}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-midnight/40">
                        Submitted {formatDate(doc.submittedAt)}
                        {doc.expiresAt ? ` · expires ${formatDate(doc.expiresAt)}` : ""}
                      </p>

                      {doc.reviewReason && (
                        <p className="mt-2 rounded-md bg-amber/5 px-2 py-1 text-xs text-amber">
                          Current reason: {doc.reviewReason}
                        </p>
                      )}

                      {doc.history.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-medium text-midnight/60">
                            {doc.history.length} previous decision
                            {doc.history.length === 1 ? "" : "s"}
                          </summary>
                          <ul className="mt-2 space-y-1.5 border-l-2 border-line pl-3">
                            {doc.history.map((review) => (
                              <li key={review.id} className="text-xs">
                                <span className="font-medium capitalize text-midnight/70">
                                  {review.outcome}
                                </span>
                                <span className="text-midnight/40">
                                  {" "}· {review.reviewerEmail ?? "unknown"} ·{" "}
                                  {formatDate(review.createdAt)}
                                </span>
                                {review.reason && (
                                  <p className="text-midnight/60">{review.reason}</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>

                    <DocumentReviewActions
                      documentId={doc.id}
                      status={doc.status}
                      reasons={reasons}
                      emailConfigured={emailConfigured}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-gold text-midnight" : "bg-white text-midnight/60 ring-1 ring-line hover:bg-midnight/5"
      }`}
    >
      {label}
    </a>
  );
}
