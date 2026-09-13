// Have I Been Pwned's range API, which is built so the password never leaves
// the browser.
//
// The password is hashed locally, only the first five characters of the hash
// are sent, and HIBP returns every suffix under that prefix — a few hundred
// hashes. The match is done here. HIBP learns a 5-character prefix shared by
// roughly half a million passwords, which tells it nothing about this one.
//
// This is why the check is worth doing at all: "length beats symbols" is only
// true for passwords nobody has seen before, and the top of every breach list
// is full of long passwords that meet every composition rule.

const HIBP_RANGE_ENDPOINT = "https://api.pwnedpasswords.com/range";

async function sha1Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export interface BreachCheckResult {
  /** True only on a confirmed match. An unreachable service is not a match. */
  breached: boolean;
  /** False when the check could not run, so callers can decide what that means. */
  checked: boolean;
}

/**
 * Fails open, deliberately. If HIBP is unreachable or slow, someone must still
 * be able to set a password — locking people out of their own account because
 * a third-party API is down trades a real outage for a hypothetical risk.
 */
export async function isPasswordBreached(password: string): Promise<BreachCheckResult> {
  if (!password) return { breached: false, checked: false };

  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`${HIBP_RANGE_ENDPOINT}/${prefix}`, {
      // Padding asks HIBP to return a random number of decoy hashes, so the
      // response size cannot be used to infer anything about the prefix.
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return { breached: false, checked: false };

    const body = await response.text();

    for (const line of body.split("\n")) {
      const [candidate, count] = line.trim().split(":");
      // A padded decoy has a count of 0; a real hit does not.
      if (candidate === suffix && Number(count) > 0) {
        return { breached: true, checked: true };
      }
    }

    return { breached: false, checked: true };
  } catch {
    return { breached: false, checked: false };
  }
}
