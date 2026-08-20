import { redirect } from "next/navigation";
import { createClient } from "./server";

type Role = "customer" | "partner" | "admin";

// Server-side route guard: redirects to sign-in if no session, or to a safe
// fallback if the signed-in user's role isn't in `allowedRoles`. Call from a
// layout so every page under it is protected without repeating the check.
export async function requireRole(allowedRoles: Role[], currentPath: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/account/sign-in?next=${encodeURIComponent(currentPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role as Role)) {
    redirect("/account");
  }

  return { userId: userData.user.id, role: profile.role as Role };
}

// Looser guard for routes that only need a signed-in user, any role.
export async function requireAuth(currentPath: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/account/sign-in?next=${encodeURIComponent(currentPath)}`);
  }

  return { userId: userData.user.id };
}
