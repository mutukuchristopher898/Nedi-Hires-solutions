import MessageStatusSelect from "@/components/admin/MessageStatusSelect";
import { getContactMessages } from "@/lib/supabase/queries";
import { site } from "@/lib/site";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();
  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Contact Enquiries</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Messages submitted through the contact form. There is no automated email reply yet, so
        respond directly to the address or phone number shown.
      </p>

      {messages.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">No enquiries yet.</p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-midnight/60">
            {newCount} new · {messages.length} total
          </p>

          <div className="mt-4 space-y-4">
            {messages.map((m) => (
              <article key={m.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-midnight">{m.name}</h2>
                    <p className="mt-0.5 text-sm text-midnight/60">
                      <a href={`mailto:${m.email}`} className="hover:text-midnight hover:underline">
                        {m.email}
                      </a>
                      {m.phone && (
                        <>
                          {" · "}
                          <a href={`tel:${m.phone}`} className="hover:text-midnight hover:underline">
                            {m.phone}
                          </a>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-midnight/40">{formatDate(m.createdAt)}</p>
                  </div>
                  <MessageStatusSelect id={m.id} status={m.status} senderName={m.name} />
                </div>

                <p className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-sm text-midnight/80">
                  {m.message}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your enquiry to ${site.name}`)}`}
                    className="rounded-md bg-gold px-4 py-2 font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
                  >
                    Reply by email
                  </a>
                  {m.phone && (
                    <a
                      href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-line px-4 py-2 font-semibold text-midnight transition hover:bg-midnight/5"
                    >
                      Reply on WhatsApp
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
