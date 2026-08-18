"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { documentQueue as initialQueue } from "@/lib/data";
import type { ApprovalStatus } from "@/lib/types";

export default function AdminDocumentsPage() {
  const [queue, setQueue] = useState(initialQueue);

  function setStatus(id: string, status: ApprovalStatus) {
    setQueue((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Identity Verification Queue</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Validate driver credentials submitted during the booking flow before final settlement
        is unlocked. Actions here are simulated for this prototype.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full text-sm">
          <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-midnight/50">
            <tr>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Booking Ref</th>
              <th className="px-5 py-3">Document</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {queue.map((doc) => (
              <tr key={doc.id}>
                <td className="px-5 py-3 font-medium text-midnight">{doc.customerName}</td>
                <td className="px-5 py-3 font-mono text-xs text-midnight/70">{doc.bookingRef}</td>
                <td className="px-5 py-3 text-midnight/70">{doc.docType}</td>
                <td className="px-5 py-3 text-midnight/70">{doc.submittedOn}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-5 py-3">
                  {doc.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatus(doc.id, "approved")}
                        className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark"
                      >
                        Validate
                      </button>
                      <button
                        onClick={() => setStatus(doc.id, "rejected")}
                        className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setStatus(doc.id, "pending")}
                      className="text-xs font-medium text-midnight/50 hover:text-midnight"
                    >
                      Revert to pending
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
