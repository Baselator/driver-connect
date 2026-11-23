import { MAX_SPACES_PER_FACILITY, MIN_EXTRA_INSIDE_PLACES, MIN_SPACES_PER_FACILITY } from "@/config/appConfig";
import { DEMO_FACILITIES } from "@/data/facilities";
import type { Facility } from "@/models/types";

/**
 * Enforces the core business rules (invalid entries are corrected and reported in development):
 *  1. a facility has 10–20 truck spaces, never more than 20;
 *  2. there are always MORE places inside the facility than parking spaces.
 */
export function enforceCapacityRules(f: Facility): Facility {
  const total = Math.min(MAX_SPACES_PER_FACILITY, Math.max(MIN_SPACES_PER_FACILITY, Math.round(f.totalSpaces)));
  if (total !== f.totalSpaces && __DEV__) {
    console.warn(`[DriverConnect] ${f.name}: totalSpaces ${f.totalSpaces} is outside 10–20, using ${total}.`);
  }
  const baseAvailable = Math.min(total, Math.max(0, f.baseAvailable));
  const entryCapacity = Math.max(f.entryCapacity, total + MIN_EXTRA_INSIDE_PLACES);
  if (entryCapacity !== f.entryCapacity && __DEV__) {
    console.warn(`[DriverConnect] ${f.name}: entryCapacity must be larger than ${total} parking spaces, using ${entryCapacity}.`);
  }
  const extra = entryCapacity - total;
  const baseWalkInVisitors = Math.min(extra - 1, Math.max(0, f.baseWalkInVisitors));
  return { ...f, totalSpaces: total, baseAvailable, entryCapacity, baseWalkInVisitors };
}

const FACILITIES: Facility[] = DEMO_FACILITIES.map(enforceCapacityRules);

/** Async on purpose: a real API call can replace this later without changing screens. */
export async function fetchFacilities(): Promise<Facility[]> {
  return FACILITIES;
}

export function getFacilitiesSync(): Facility[] {
  return FACILITIES;
}

export function getFacilityById(id: string): Facility | undefined {
  return FACILITIES.find((f) => f.id === id);
}
