// Server-only. Never import this from a "use client" file — it reads secret,
// non-NEXT_PUBLIC env vars that must not reach the browser bundle.
//
// The exact Smile Identity request/response shape below is a best-effort
// placeholder based on their commonly documented job-based API. It should be
// checked against Smile Identity's live docs once real credentials exist —
// this file is the single, contained integration point for that.

const PARTNER_ID = process.env.SMILE_IDENTITY_PARTNER_ID;
const API_KEY = process.env.SMILE_IDENTITY_API_KEY;
const API_BASE = process.env.SMILE_IDENTITY_API_BASE ?? "https://api.smileidentity.com/v1";

export type VerificationOutcome = "verified" | "needs_review" | "failed" | "unconfigured";

export interface VerificationResult {
  outcome: VerificationOutcome;
  notes: string;
}

function isConfigured(): boolean {
  return Boolean(PARTNER_ID && API_KEY);
}

export async function verifyDocument({
  imageBytes,
  idType,
  idNumber,
  fullName,
}: {
  imageBytes: Uint8Array;
  idType: string;
  idNumber: string;
  fullName: string;
}): Promise<VerificationResult> {
  if (!isConfigured()) {
    return { outcome: "unconfigured", notes: "Smile Identity credentials are not configured yet." };
  }

  try {
    const response = await fetch(`${API_BASE}/document-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        partner_id: PARTNER_ID,
        id_type: idType,
        id_number: idNumber,
        full_name: fullName,
        image: Buffer.from(imageBytes).toString("base64"),
      }),
    });

    if (!response.ok) {
      return { outcome: "needs_review", notes: `Document verification request failed (HTTP ${response.status}).` };
    }

    const data = await response.json();

    if (data?.result_code === "document_not_recognized") {
      return { outcome: "failed", notes: "The uploaded file doesn't appear to be a valid ID or passport." };
    }

    if (data?.confidence !== undefined && data.confidence < 0.7) {
      return { outcome: "needs_review", notes: `Low document-verification confidence (${data.confidence}).` };
    }

    return { outcome: "verified", notes: "Document verified automatically." };
  } catch (err) {
    return {
      outcome: "needs_review",
      notes: `Document verification call errored: ${err instanceof Error ? err.message : "unknown error"}.`,
    };
  }
}

export async function verifySelfie({
  selfieBytes,
  documentImageBytes,
}: {
  selfieBytes: Uint8Array;
  documentImageBytes: Uint8Array;
}): Promise<VerificationResult> {
  if (!isConfigured()) {
    return { outcome: "unconfigured", notes: "Smile Identity credentials are not configured yet." };
  }

  try {
    const response = await fetch(`${API_BASE}/selfie-match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        partner_id: PARTNER_ID,
        selfie_image: Buffer.from(selfieBytes).toString("base64"),
        document_image: Buffer.from(documentImageBytes).toString("base64"),
      }),
    });

    if (!response.ok) {
      return { outcome: "needs_review", notes: `Selfie match request failed (HTTP ${response.status}).` };
    }

    const data = await response.json();

    if (data?.match_score !== undefined && data.match_score < 0.7) {
      return { outcome: "needs_review", notes: `Low selfie/document match score (${data.match_score}).` };
    }

    return { outcome: "verified", notes: "Selfie matched the submitted document automatically." };
  } catch (err) {
    return {
      outcome: "needs_review",
      notes: `Selfie match call errored: ${err instanceof Error ? err.message : "unknown error"}.`,
    };
  }
}
