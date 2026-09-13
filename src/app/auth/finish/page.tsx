import { Suspense } from "react";
import AuthFinish from "@/components/account/AuthFinish";

/**
 * Where /auth/callback sends someone when the link carried no ?code.
 *
 * Supabase returns the session either as a query code (PKCE) or in the URL
 * fragment. A fragment never reaches the server, so only the browser can
 * complete that second case — which is the whole reason this page exists.
 */
export default function AuthFinishPage() {
  return (
    <Suspense fallback={null}>
      <AuthFinish />
    </Suspense>
  );
}
