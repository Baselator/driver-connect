import { ALMOST_FULL_THRESHOLD } from "@/config/appConfig";
import { BUNDLES } from "@/config/pricing";
import type { Availability, AvailabilityLevel, Booking, BundleType, Facility } from "@/models/types";

/**
 * Local demo availability service – always calculated for the CURRENT moment.
 *
 * Parking:  other (simulated) drivers use `totalSpaces - baseAvailable` spaces during the day,
 *           plus `nightExtraOccupied` 22:00–05:00. Each of your confirmed parking bookings holds 1 space.
 * Inside:   places inside = entryCapacity (always > totalSpaces). Every parking space has its own place
 *           inside; the extra places (entryCapacity - totalSpaces) are for "Facility Entry Only" visitors.
 *           => free places inside are ALWAYS at least the number of free parking spaces.
 * For a period we take the PEAK occupancy, so overlapping bookings can never exceed capacity.
 */

const HOUR = 3600_000;

function isNight(ts: number) {
  const h = new Date(ts).getHours();
  return h >= 22 || h < 5;
}

function othersParking(f: Facility, ts: number) {
  const base = f.totalSpaces - f.baseAvailable;
  return Math.min(f.totalSpaces, base + (isNight(ts) ? f.nightExtraOccupied : 0));
}

const overlaps = (b: Booking, start: number, end: number) => b.startAt < end && b.endAt > start;

/** Points in [start, end) where occupancy can change (period start, hour boundaries, booking starts). */
function checkpoints(start: number, end: number, bookings: Booking[]): number[] {
  const pts = new Set<number>([start]);
  let h = Math.ceil(start / HOUR) * HOUR;
  while (h < end) {
    pts.add(h);
    h += HOUR;
  }
  for (const b of bookings) if (b.startAt > start && b.startAt < end) pts.add(b.startAt);
  return [...pts];
}

export function getAvailability(
  facility: Facility,
  start: number,
  end: number,
  allBookings: Booking[],
  excludeBookingId?: string,
): Availability {
  const relevant = allBookings.filter(
    (b) =>
      b.facilityId === facility.id &&
      b.status === "confirmed" &&
      b.id !== excludeBookingId &&
      overlaps(b, start, end),
  );
  const extraPlaces = facility.entryCapacity - facility.totalSpaces;
  let peakParking = 0;
  let peakWalkIn = 0;
  for (const t of checkpoints(start, end, relevant)) {
    const active = relevant.filter((b) => b.startAt <= t && b.endAt > t);
    const mineParking = active.filter((b) => BUNDLES[b.bundle].includesParking).length;
    peakParking = Math.max(peakParking, othersParking(facility, t) + mineParking);
    peakWalkIn = Math.max(peakWalkIn, facility.baseWalkInVisitors + (active.length - mineParking));
  }
  const parkingAvailable = Math.max(0, facility.totalSpaces - peakParking);
  const walkInAvailable = Math.max(0, extraPlaces - peakWalkIn);
  return {
    parkingTotal: facility.totalSpaces,
    parkingAvailable,
    entryTotal: facility.entryCapacity,
    entryAvailable: parkingAvailable + walkInAvailable,
    walkInAvailable,
  };
}

/** Availability right now (used on map pins, lists and the details header). */
export function getCurrentAvailability(facility: Facility, bookings: Booking[], now = Date.now()): Availability {
  return getAvailability(facility, now, now + 60_000, bookings);
}

/** Is this bundle sold out for the given availability? */
export function bundleBlocked(bundle: BundleType, av: Availability): boolean {
  return BUNDLES[bundle].includesParking ? av.parkingAvailable <= 0 : av.walkInAvailable <= 0;
}

export function availabilityLevel(available: number): AvailabilityLevel {
  if (available <= 0) return "full";
  if (available <= ALMOST_FULL_THRESHOLD) return "almostFull";
  return "available";
}

export const LEVEL_LABEL: Record<AvailabilityLevel, string> = {
  available: "Available",
  almostFull: "Almost full",
  full: "Fully booked",
};
