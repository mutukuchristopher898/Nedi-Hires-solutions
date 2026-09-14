import OptionListEditor from "@/components/admin/OptionListEditor";
import { requireRole } from "@/lib/supabase/authz";
import { getAllOptions } from "@/lib/supabase/queries";
import { ALL_OPTION_LISTS } from "@/lib/optionLists";

export default async function AdminSettingsPage() {
  // Editing these changes what everyone else is offered, so admin-only —
  // matching the RLS policy, which is what actually enforces it.
  await requireRole(["admin"], "/admin/settings");

  const options = await getAllOptions();

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Settings</h1>
      <p className="mt-1 text-sm text-midnight/60">
        The lists that appear in forms across the site. Adding a pickup location or a rejection
        reason here takes effect immediately, it no longer needs a code change.
      </p>
      <p className="mt-2 text-sm text-midnight/60">
        Retiring an option stops it being offered but leaves records that already use it alone.
        Deleting removes it outright, which is only sensible for something added by mistake.
      </p>

      <div className="mt-6 space-y-6">
        {ALL_OPTION_LISTS.map((list) => (
          <OptionListEditor
            key={list}
            list={list}
            options={options.filter((o) => o.list === list)}
          />
        ))}
      </div>

      <p className="mt-8 text-xs text-midnight/40">
        Vehicle classes are not here yet: they are a database constraint and appear in search
        URLs, so making them editable means deciding what happens to listings whose class is
        removed. That is its own piece of work.
      </p>
    </div>
  );
}
