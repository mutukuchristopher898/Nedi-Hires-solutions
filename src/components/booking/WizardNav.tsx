"use client";

import Link from "next/link";
import type { BookingStep } from "@/lib/types";
import { isBackable, previousStep, STEP_LABELS, STEP_ORDER } from "@/lib/bookingSteps";

export default function WizardNav({
  vehicleId,
  current,
  furthest,
  locked,
}: {
  vehicleId: string;
  current: BookingStep;
  furthest: BookingStep;
  locked: boolean;
}) {
  const currentIndex = STEP_ORDER.indexOf(current);
  const furthestIndex = STEP_ORDER.indexOf(furthest);
  const back = previousStep(current);
  const canGoBack = isBackable(current, locked) && back;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        {canGoBack ? (
          <Link
            href={`/booking/${vehicleId}/${back}`}
            className="text-sm font-medium text-midnight/60 transition hover:text-midnight"
          >
            ← Back
          </Link>
        ) : (
          <span />
        )}
        <p className="text-xs font-medium text-midnight/50">
          Step {currentIndex + 1} of {STEP_ORDER.length}
        </p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-midnight/10">
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${((currentIndex + 1) / STEP_ORDER.length) * 100}%` }}
        />
      </div>

      <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {STEP_ORDER.map((step, index) => {
          const isCurrent = step === current;
          const isClickable = !locked && index <= furthestIndex && !isCurrent;

          return (
            <li key={step}>
              {isClickable ? (
                <Link href={`/booking/${vehicleId}/${step}`} className="text-midnight/50 underline-offset-2 hover:text-midnight hover:underline">
                  {STEP_LABELS[step]}
                </Link>
              ) : (
                <span className={isCurrent ? "font-semibold text-midnight" : "text-midnight/30"}>{STEP_LABELS[step]}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
