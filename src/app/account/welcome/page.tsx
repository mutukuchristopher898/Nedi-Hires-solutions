import ResetPasswordForm from "@/components/account/ResetPasswordForm";
import { requireAuth } from "@/lib/supabase/authz";

// Where the "confirm your booking" email lands a guest, once /auth/callback
// has confirmed their email (which turns their guest session into a full
// account). They create a password here, so they can sign in any time.
export default async function WelcomePage() {
  await requireAuth("/account/welcome");
  return (
    <div className="container-shell max-w-md py-16">
      <h1 className="text-2xl font-bold text-midnight">Your account is ready</h1>
      <p className="mt-2 text-sm text-midnight/65">
        Your email is confirmed and your booking request is saved to your account. Create a
        password so you can sign in and follow your booking any time.
      </p>
      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
