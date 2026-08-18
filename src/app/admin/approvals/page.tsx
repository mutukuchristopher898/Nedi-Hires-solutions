"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { partnerUnits as initialUnits } from "@/lib/data";
import type { ApprovalStatus } from "@/lib/types";

export default function AdminApprovalsPage() {
  const [units, setUnits] = useState(initialUnits);

  function setStatus(id: string, status: ApprovalStatus) {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Unit Approval Queue</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Newly uploaded partner units are visible on the customer frontend only after approval.
        Actions here are simulated for this prototype.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full text-sm">
          <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-midnight/50">
            <tr>
              <th className="px-5 py-3">Vehicle</th>
              <th className="px-5 py-3">Classification</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {units.map((unit) => (
              <tr key={unit.id}>
                <td className="px-5 py-3 font-medium text-midnight">{unit.vehicleName}</td>
                <td className="px-5 py-3 text-midnight/70">{unit.classification}</td>
                <td className="px-5 py-3 text-midnight/70">{unit.submittedOn}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={unit.status} />
                </td>
                <td className="px-5 py-3">
                  {unit.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatus(unit.id, "approved")}
                        className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setStatus(unit.id, "rejected")}
                        className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setStatus(unit.id, "pending")}
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
