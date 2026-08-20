import { getQuoteRequests } from "@/lib/supabase/queries";
import QuoteStatusSelect from "@/components/admin/QuoteStatusSelect";

export default async function AdminQuotesPage() {
  const quotes = await getQuoteRequests();

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Partner Quote Requests</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Custom pricing requests from partners listing more vehicles than the standard tier
        covers.
      </p>

      {quotes.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">No quote requests yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full text-sm">
            <thead className="bg-offwhite text-left text-xs uppercase tracking-wide text-midnight/50">
              <tr>
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Vehicles</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="px-5 py-3 font-medium text-midnight">{q.businessName}</td>
                  <td className="px-5 py-3 text-midnight/70">
                    <div>{q.contactEmail}</div>
                    <div className="text-xs text-midnight/50">{q.contactPhone}</div>
                  </td>
                  <td className="px-5 py-3 text-midnight/70">
                    {q.vehicleCount}
                    {q.vehicleTypes && <div className="text-xs text-midnight/50">{q.vehicleTypes}</div>}
                  </td>
                  <td className="px-5 py-3 max-w-xs text-midnight/70">{q.notes ?? "—"}</td>
                  <td className="px-5 py-3 text-midnight/70">{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <QuoteStatusSelect id={q.id} status={q.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
