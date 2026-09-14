"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QuoteRequest } from "@/lib/types";

export default function QuoteStatusSelect({
  id,
  status,
  businessName,
}: {
  id: string;
  status: QuoteRequest["status"];
  businessName: string;
}) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleChange(next: QuoteRequest["status"]) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setFailed(false);

    const supabase = createClient();
    const { error } = await supabase.from("quote_requests").update({ status: next }).eq("id", id);

    setSaving(false);

    // Previously discarded, so the dropdown showed the new status whether or
    // not it saved. Put the old value back and say so.
    if (error) {
      setValue(previous);
      setFailed(true);
    }
  }

  return (
    <div>
      <select
        value={value}
        disabled={saving}
        aria-label={`Status for ${businessName}`}
        onChange={(e) => handleChange(e.target.value as QuoteRequest["status"])}
        className="rounded-md border border-line px-2 py-1 text-xs focus:border-gold focus:outline-none disabled:opacity-60"
      >
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="closed">Closed</option>
      </select>
      {failed && <p className="mt-1 text-xs text-red-600">Not saved. Try again.</p>}
    </div>
  );
}
