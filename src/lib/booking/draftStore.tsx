"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { BookingStep, TripDetails, Vehicle } from "@/lib/types";
import { combineDateAndTime, computeDropoff, toNairobiDateInputValue, toNairobiTimeInputValue } from "@/lib/duration";
import { APPLICANT_DRAFT_DEFAULTS, type ApplicantDraftFields } from "@/components/booking/ApplicantDetailsStep";

export interface BookingDraft {
  trip: TripDetails;
  applicant: ApplicantDraftFields;
  bookingId: string | null;
  bookingRef: string | null;
  applicantName: string | null;
  furthestStepReached: BookingStep;
  idempotencyKey: string;
  lockedAfterPayment: boolean;
}

interface BookingDraftContextValue {
  draft: BookingDraft;
  patchDraft: (patch: Partial<BookingDraft>) => void;
  vehicle: Vehicle;
  vehicleDbId: string;
}

const BookingDraftContext = createContext<BookingDraftContextValue | null>(null);

const todayIso = () => new Date().toISOString().slice(0, 10);

function defaultTrip(vehicle: Vehicle): TripDetails {
  const pickupDate = todayIso();
  const pickupTime = "09:00";
  const durationUnit = "days" as const;
  const durationQuantity = 3;
  const dropoffAt = computeDropoff(combineDateAndTime(pickupDate, pickupTime), durationUnit, durationQuantity);
  return {
    pickupDate,
    pickupTime,
    pickupPoint: vehicle.location,
    destination: "",
    purpose: "personal",
    durationUnit,
    durationQuantity,
    dropoffDate: toNairobiDateInputValue(dropoffAt),
    dropoffTime: toNairobiTimeInputValue(dropoffAt),
    returnToDifferentLocation: false,
    dropoffPoint: "",
    driveType: "self_drive",
    dateOfBirth: "",
    licenseIssueDate: "",
  };
}

function storageKey(vehicleId: string) {
  return `booking-draft:${vehicleId}`;
}

// A fresh draft, including a fresh idempotency key — persisted immediately
// (a plain function call at lazy-init time, not a useEffect) so the same
// key survives a refresh rather than being regenerated on every mount.
function createAndPersistDraft(vehicle: Vehicle): BookingDraft {
  const draft: BookingDraft = {
    trip: defaultTrip(vehicle),
    applicant: APPLICANT_DRAFT_DEFAULTS,
    bookingId: null,
    bookingRef: null,
    applicantName: null,
    furthestStepReached: "trip",
    idempotencyKey: crypto.randomUUID(),
    lockedAfterPayment: false,
  };
  sessionStorage.setItem(storageKey(vehicle.id), JSON.stringify(draft));
  return draft;
}

function loadInitialDraft(vehicle: Vehicle): BookingDraft {
  if (typeof window === "undefined") {
    // SSR-safe placeholder — this branch never actually renders interactive
    // UI (the provider's children are all client-only step pages), it just
    // needs a value shaped correctly so the lazy initializer type-checks.
    return {
      trip: defaultTrip(vehicle),
      applicant: APPLICANT_DRAFT_DEFAULTS,
      bookingId: null,
      bookingRef: null,
      applicantName: null,
      furthestStepReached: "trip",
      idempotencyKey: "",
      lockedAfterPayment: false,
    };
  }

  const raw = sessionStorage.getItem(storageKey(vehicle.id));
  if (!raw) return createAndPersistDraft(vehicle);

  try {
    const parsed = JSON.parse(raw) as BookingDraft;
    if (!parsed.idempotencyKey) return createAndPersistDraft(vehicle);
    return parsed;
  } catch {
    return createAndPersistDraft(vehicle);
  }
}

export function BookingDraftProvider({
  vehicle,
  vehicleDbId,
  children,
}: {
  vehicle: Vehicle;
  vehicleDbId: string;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState<BookingDraft>(() => loadInitialDraft(vehicle));

  function patchDraft(patch: Partial<BookingDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      sessionStorage.setItem(storageKey(vehicle.id), JSON.stringify(next));
      return next;
    });
  }

  return (
    <BookingDraftContext.Provider value={{ draft, patchDraft, vehicle, vehicleDbId }}>
      {children}
    </BookingDraftContext.Provider>
  );
}

export function useBookingDraft() {
  const ctx = useContext(BookingDraftContext);
  if (!ctx) throw new Error("useBookingDraft must be used within a BookingDraftProvider");
  return ctx;
}

// spec §6 — "Do not allow backward navigation after payment authorisation."
// Covers direct URL entry to an earlier step after the deposit has been
// paid, not just hidden nav links (which WizardNav already stops rendering).
export function useLockGuard() {
  const { draft, vehicle } = useBookingDraft();
  const router = useRouter();

  useEffect(() => {
    if (draft.lockedAfterPayment) {
      router.replace(`/booking/${vehicle.id}/verification`);
    }
  }, [draft.lockedAfterPayment, vehicle.id, router]);
}

// Covers direct URL entry to a step that requires an already-created
// booking (every step after Trip) before one exists.
export function useRequireBookingId() {
  const { draft, vehicle } = useBookingDraft();
  const router = useRouter();

  useEffect(() => {
    if (!draft.bookingId) {
      router.replace(`/booking/${vehicle.id}/trip`);
    }
  }, [draft.bookingId, vehicle.id, router]);
}
