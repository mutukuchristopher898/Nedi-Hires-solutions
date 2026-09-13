"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OPTION_LIST_HINTS, OPTION_LIST_LABELS, type OptionList } from "@/lib/optionLists";
import type { AdminOption } from "@/lib/supabase/queries";

export default function OptionListEditor({
  list,
  options,
}: {
  list: OptionList;
  options: AdminOption[];
}) {
  const router = useRouter();
  const [newValue, setNewValue] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, work: () => Promise<{ error: { message: string } | null }>) {
    setBusy(key);
    setError(null);
    const { error: writeError } = await work();
    setBusy(null);

    if (writeError) {
      setError(writeError.message);
      return;
    }
    router.refresh();
  }

  function add() {
    const value = newValue.trim();
    if (!value) return;

    if (options.some((o) => o.value.toLowerCase() === value.toLowerCase())) {
      setError("That option is already on this list.");
      return;
    }

    const nextOrder = Math.max(0, ...options.map((o) => o.sortOrder)) + 1;
    const supabase = createClient();
    run("add", async () => {
      const result = await supabase
        .from("admin_options")
        .insert({ list, value, sort_order: nextOrder });
      if (!result.error) setNewValue("");
      return result;
    });
  }

  function setActive(value: string, active: boolean) {
    const supabase = createClient();
    run(value, async () =>
      supabase.from("admin_options").update({ active }).eq("list", list).eq("value", value)
    );
  }

  function move(value: string, direction: -1 | 1) {
    const ordered = [...options].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((o) => o.value === value);
    const swapWith = ordered[index + direction];
    if (!swapWith) return;

    // Swapping the two sort values rather than renumbering the whole list —
    // two writes instead of N, and no chance of a partial renumber leaving
    // the order scrambled.
    const supabase = createClient();
    run(value, async () => {
      const a = await supabase.from("admin_options").update({ sort_order: swapWith.sortOrder })
        .eq("list", list).eq("value", value);
      if (a.error) return a;
      return supabase.from("admin_options").update({ sort_order: ordered[index].sortOrder })
        .eq("list", list).eq("value", swapWith.value);
    });
  }

  function remove(value: string) {
    const supabase = createClient();
    run(value, async () =>
      supabase.from("admin_options").delete().eq("list", list).eq("value", value)
    );
  }

  const ordered = [...options].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <h2 className="font-semibold text-midnight">{OPTION_LIST_LABELS[list]}</h2>
      <p className="mt-1 text-sm text-midnight/60">{OPTION_LIST_HINTS[list]}</p>

      {ordered.length === 0 ? (
        <p className="mt-3 text-sm text-midnight/50">
          Nothing on this list — the built-in defaults are being used.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {ordered.map((option, index) => (
            <li
              key={option.value}
              className={`flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 ring-1 ${
                option.active ? "bg-offwhite ring-line" : "bg-midnight/5 ring-midnight/10"
              }`}
            >
              <span className={`flex-1 text-sm ${option.active ? "text-midnight" : "text-midnight/40 line-through"}`}>
                {option.value}
              </span>

              <button type="button" onClick={() => move(option.value, -1)} disabled={index === 0 || busy !== null}
                aria-label={`Move ${option.value} up`}
                className="rounded border border-line px-1.5 text-xs text-midnight/60 disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(option.value, 1)} disabled={index === ordered.length - 1 || busy !== null}
                aria-label={`Move ${option.value} down`}
                className="rounded border border-line px-1.5 text-xs text-midnight/60 disabled:opacity-30">↓</button>

              {/* Retiring, not deleting, is the normal action: an option already
                  used by existing records should stop being offered without
                  rewriting what it was called at the time. */}
              <button type="button" onClick={() => setActive(option.value, !option.active)} disabled={busy !== null}
                className="rounded border border-line px-2 py-0.5 text-xs font-medium text-midnight/70 transition hover:bg-midnight/5 disabled:opacity-40">
                {option.active ? "Retire" : "Restore"}
              </button>
              <button type="button" onClick={() => remove(option.value)} disabled={busy !== null}
                aria-label={`Delete ${option.value}`}
                className="rounded border border-red-500/40 px-2 py-0.5 text-xs font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-40">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={`Add to ${OPTION_LIST_LABELS[list].toLowerCase()}`}
          aria-label={`Add to ${OPTION_LIST_LABELS[list]}`}
          maxLength={120}
          className="flex-1 rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <button type="button" onClick={add} disabled={busy !== null || !newValue.trim()}
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-50">
          {busy === "add" ? "Adding…" : "Add"}
        </button>
      </div>

      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
