"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthFinish() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const [stuck, setStuck] = useState(false);

  // An effect is unavoidable here: the answer is in window.location.hash,
  // which exists only in the browser. createBrowserClient has
  // detectSessionInUrl on by default, so simply constructing it consumes the
  // fragment and stores the session; this then confirms one actually exists
  // rather than assuming it worked.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (cancelled) return;

      if (data.session) {
        const destination = next.startsWith("/") ? next : "/account";
        router.replace(destination);
        return;
      }

      // No code, no fragment, no session — the link carried nothing usable.
      setStuck(true);
      router.replace("/account/sign-in?error=link_incomplete");
    })();

    return () => {
      cancelled = true;
    };
  }, [next, router]);

  return (
    <div className="container-shell max-w-md py-20 text-center">
      <p className="text-sm text-midnight/60">
        {stuck ? "That link couldn't be completed — taking you to sign in…" : "Signing you in…"}
      </p>
    </div>
  );
}
