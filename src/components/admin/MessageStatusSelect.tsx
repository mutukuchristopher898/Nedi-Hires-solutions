"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContactMessage } from "@/lib/types";

export default function MessageStatusSelect({
  id,
  status,
  senderName,
}: {
  id: string;
  status: ContactMessage["status"];
  senderName: string;
}) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleChange(next: ContactMessage["status"]) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setFailed(false);

    const supabase = createClient();
    const { error } = await supabase.from("contact_messages").update({ status: next }).eq("id", id);

    setSaving(false);

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
        aria-label={`Status for the message from ${senderName}`}
        onChange={(e) => handleChange(e.target.value as ContactMessage["status"])}
        className="rounded-md border border-line px-2 py-1 text-xs focus:border-gold focus:outline-none disabled:opacity-60"
      >
        <option value="new">New</option>
        <option value="read">Read</option>
        <option value="replied">Replied</option>
      </select>
      {failed && <p className="mt-1 text-xs text-red-600">Not saved — try again.</p>}
    </div>
  );
}
