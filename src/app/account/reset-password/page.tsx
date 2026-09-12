import ResetPasswordForm from "@/components/account/ResetPasswordForm";
import { requireAuth } from "@/lib/supabase/authz";

/**
 * Reached only after /auth/callback has exchanged a recovery code, which is
 * what creates the session this guard requires. Someone arriving without one —
 * an expired link, or a guessed URL — is sent to sign in rather than shown a
 * form that could not work.
 */
export default async function ResetPasswordPage() {
  await requireAuth("/account/reset-password");
  return <ResetPasswordForm />;
}
