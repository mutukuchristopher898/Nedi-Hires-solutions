import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceApiRateLimit, readJsonObject, rejectCrossSite } from "@/lib/apiSecurity";

// Erasing an account has to happen in two places, and SQL can only reach one
// of them: anonymise_account() scrubs the rows, but identity documents are
// objects in storage and Postgres cannot touch the storage API. So the files
// go first, here, and the count is handed to the function so the audit entry
// records how many were removed rather than implying there were none.
//
// Files first, deliberately. If the database call fails after the files are
// gone, an admin can retry and it succeeds. The other order can leave the rows
// scrubbed and the documents still sitting in the bucket, which is the one
// outcome an erasure must not produce.

export async function POST(request: Request) {
  // Erasure is irreversible, so it is exactly the request a forged
  // cross-site form would want to trigger with an admin's session.
  const crossSite = rejectCrossSite(request);
  if (crossSite) return crossSite;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // The database checks this again inside anonymise_account, which is what
  // actually enforces it — this is here to fail early with a clear message.
  const { data: actor } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if ((actor as { role?: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Only an admin can erase an account" }, { status: 403 });
  }

  // A ceiling on erasures per admin session. A legitimate admin erases a
  // handful at most; a hijacked session should not be able to wipe the
  // customer base in a loop.
  const limited = await enforceApiRateLimit(supabase, "admin_erase");
  if (limited) return limited;

  const parsed = await readJsonObject(request);
  if ("error" in parsed) return parsed.error;
  const { profileId, confirmEmail } = parsed.body;

  if (typeof profileId !== "string" || typeof confirmEmail !== "string") {
    return NextResponse.json({ error: "Missing account details." }, { status: 400 });
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", profileId)
    .maybeSingle();

  const account = target as { id: string; email: string | null; full_name: string } | null;

  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Typing the address is the confirmation step. Checked on the server too,
  // because a modal is a suggestion.
  if (!account.email || confirmEmail.trim().toLowerCase() !== account.email.toLowerCase()) {
    return NextResponse.json(
      { error: "That email doesn't match this account. Erasure cancelled." },
      { status: 400 }
    );
  }

  // Every KYC file this person uploaded. The bucket is laid out by user id, so
  // one prefix covers them — but listing is per-folder, so the booking
  // subfolders have to be walked.
  const paths: string[] = [];
  const { data: bookingFolders } = await supabase.storage
    .from("kyc-documents")
    .list(account.id, { limit: 200 });

  for (const folder of bookingFolders ?? []) {
    const { data: files } = await supabase.storage
      .from("kyc-documents")
      .list(`${account.id}/${folder.name}`, { limit: 200 });

    for (const file of files ?? []) {
      paths.push(`${account.id}/${folder.name}/${file.name}`);
    }
  }

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from("kyc-documents").remove(paths);

    if (removeError) {
      // Stopping here on purpose: a "successful" erasure that left identity
      // documents in the bucket would be worse than a failed one, because
      // nobody would go back and check.
      return NextResponse.json(
        { error: "Could not remove the stored documents, so nothing was erased. Try again." },
        { status: 502 }
      );
    }
  }

  const { error: rpcError } = await supabase.rpc("anonymise_account", {
    p_profile_id: account.id,
    p_documents_erased: paths.length,
  });

  if (rpcError) {
    console.error("erase-account: anonymise_account failed", rpcError.code, rpcError.message);
    // Messages raised deliberately by anonymise_account are written for
    // admins and pass through; anything else stays in the logs.
    return NextResponse.json(
      { error: rpcError.code === "P0001" ? rpcError.message : "The account could not be erased. Try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ erased: true, documentsErased: paths.length });
}
