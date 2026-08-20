"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QuoteRequest } from "@/lib/types";

export default function QuoteStatusSelect({ id, status }: { id: string; status: QuoteRequest["status"] }) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: QuoteRequest["status"]) {
    setValue(next);
    setSaving(true);
    const supabase = createClient();
    await supabase.from("quote_requests").update({ status: next }).eq("id", id);
    setSaving(false);
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as QuoteRequest["status"])}
      className="rounded-md border border-line px-2 py-1 text-xs focus:border-gold focus:outline-none disabled:opacity-60"
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="closed">Closed</option>
    </select>
  );
}
