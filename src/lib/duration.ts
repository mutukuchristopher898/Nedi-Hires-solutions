// spec §7 — a duration control with Hours/Days/Weeks/Months, calendar-correct
// month math (Jan 31 + 1 month = Feb 28/29, never a naive days*86_400_000).
//
// NOTE on date-fns: this module deliberately does NOT use date-fns's
// addMonths/addDays/etc. Those functions read a Date's *local* (system
// timezone) calendar fields — in a browser that's the visitor's own OS
// timezone, which this app has no control over and which may observe DST
// (most of the world does). Adding 3 months from a pre-DST-transition date
// to a post-transition one silently shifted the absolute instant by an
// hour in testing — exactly the "off-by-one-hour pickup time" bug the spec
// warns about, just from the library's own local-timezone assumption
// rather than naive ms arithmetic. Since Kenya itself has no DST, doing the
// arithmetic on plain UTC-based wall-clock numbers representing Nairobi
// local time (never touching the runtime's local timezone at all) is both
// simpler and fully immune to this class of bug, in the browser or on the
// server, regardless of the visitor's or host's own timezone.
export type DurationUnit = "hours" | "days" | "weeks" | "months";

export const MAX_RENTAL_DAYS = 90;
export const WEEKLY_THRESHOLD_DAYS = 7;
export const MONTHLY_THRESHOLD_DAYS = 28;
export const WEEKLY_DISCOUNT = 0.1;
export const MONTHLY_DISCOUNT = 0.25;

// The reservation deposit taken up front to hold the vehicle. A percentage,
// not a flat figure: a flat KES 5,000 exceeded the entire rental total on 77
// of the 245 catalogue vehicles (anything at KES 3,200-4,000/day hired for a
// single day), and settlement's Math.max(total - 5000, 0) silently absorbed
// the overpayment instead of surfacing it.
//
// Distinct from SECURITY_DEPOSIT_RATE, and both survive: the reservation
// deposit is a slice of the rental total; the security deposit is refundable
// and held on top at handover.
//
// Mirrored in SQL by enforce_booking_money() in
// supabase/migrations/20260903120000_booking_money_status_and_eligibility_integrity.sql,
// which is authoritative — the figures here are a display estimate only.
// Keep both in sync if these rates change.
export const RESERVATION_DEPOSIT_RATE = 0.3;
export const SECURITY_DEPOSIT_RATE = 0.15;

export function reservationDeposit(total: number): number {
  return Math.round(total * RESERVATION_DEPOSIT_RATE);
}

export function securityDeposit(total: number): number {
  return Math.round(total * SECURITY_DEPOSIT_RATE);
}

const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000; // Africa/Nairobi is a fixed UTC+3, no DST.

interface WallClock {
  year: number;
  month: number; // 0-indexed
  day: number;
  hour: number;
  minute: number;
}

// A real absolute instant -> its Nairobi wall-clock calendar fields, read
// via UTC getters only (never local getters, which depend on system TZ).
function toWallClock(instant: Date): WallClock {
  const shifted = new Date(instant.getTime() + NAIROBI_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

// Nairobi wall-clock calendar fields -> the real absolute instant they refer to.
function fromWallClock(w: WallClock): Date {
  return new Date(Date.UTC(w.year, w.month, w.day, w.hour, w.minute) - NAIROBI_OFFSET_MS);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// Kenya has no DST and this business operates in a single timezone, so a
// fixed Africa/Nairobi (+03:00) offset is all "timezone-safe storage" needs
// here — no per-branch IANA-timezone system required.
export function combineDateAndTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time || "00:00").split(":").map(Number);
  return fromWallClock({ year, month: month - 1, day, hour, minute });
}

const NAIROBI_TZ = "Africa/Nairobi";

// Format a Date back into <input type=date/time> values using Nairobi wall-clock
// components regardless of the viewer's own browser/system timezone — a
// diaspora customer browsing from abroad should see Kenya-local pickup/drop-off
// times, not values silently shifted by their own timezone.
export function toNairobiDateInputValue(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NAIROBI_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date
  );
}

export function toNairobiTimeInputValue(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: NAIROBI_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function computeDropoff(pickupAt: Date, unit: DurationUnit, quantity: number): Date {
  const w = toWallClock(pickupAt);

  switch (unit) {
    case "hours":
      return fromWallClock({ ...w, hour: w.hour + quantity });
    case "days":
      return fromWallClock({ ...w, day: w.day + quantity });
    case "weeks":
      return fromWallClock({ ...w, day: w.day + quantity * 7 });
    case "months": {
      const totalMonths = w.year * 12 + w.month + quantity;
      const targetYear = Math.floor(totalMonths / 12);
      const targetMonth = ((totalMonths % 12) + 12) % 12;
      const clampedDay = Math.min(w.day, daysInMonth(targetYear, targetMonth));
      return fromWallClock({ ...w, year: targetYear, month: targetMonth, day: clampedDay });
    }
  }
}

// Any partial day bills as a full day (standard car-rental practice) —
// this is what actually determines pricing, never the duration unit/quantity
// the customer picked (which can go stale once drop-off is edited directly).
export function effectiveDays(pickupAt: Date, dropoffAt: Date): number {
  const hours = (dropoffAt.getTime() - pickupAt.getTime()) / (60 * 60 * 1000);
  if (hours <= 0) return 0;
  return Math.ceil(hours / 24);
}

export interface PricingResult {
  total: number;
  rateLabel: string | null;
  savingsAmount: number;
}

// Flat whole-stay discount once a threshold is crossed — not a blended/
// prorated engine. Every rate here is an indicative placeholder (DemoTag'd
// in the UI), so simplicity is preferred over precision.
export function computePricing(pricePerDay: number, days: number): PricingResult {
  const base = pricePerDay * days;

  if (days >= MONTHLY_THRESHOLD_DAYS) {
    const total = Math.round(base * (1 - MONTHLY_DISCOUNT));
    return { total, rateLabel: "Monthly rate applied", savingsAmount: base - total };
  }
  if (days >= WEEKLY_THRESHOLD_DAYS) {
    const total = Math.round(base * (1 - WEEKLY_DISCOUNT));
    return { total, rateLabel: "Weekly rate applied", savingsAmount: base - total };
  }
  return { total: base, rateLabel: null, savingsAmount: 0 };
}

const UNIT_LABELS: Record<DurationUnit, string> = { hours: "hour", days: "day", weeks: "week", months: "month" };

export function formatDurationLabel(unit: DurationUnit, quantity: number): string {
  const label = UNIT_LABELS[unit];
  return `${quantity} ${label}${quantity === 1 ? "" : "s"}`;
}

// Flat, symmetric, indicative fee per unordered pair of the 4 known depots.
// No allowed-routes table exists, and all 4 are plausible to service, so
// every cross-depot pair gets a fee rather than being blocked.
const ONE_WAY_FEE_KES = 6000;

export function oneWayFee(pickup: string, dropoff: string): number {
  if (!pickup || !dropoff || pickup === dropoff) return 0;
  return ONE_WAY_FEE_KES;
}
