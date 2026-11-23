import type { LatLng } from "@/models/types";

/** Google Maps Platform key (Places API (New) + Routes API). Empty = offline demo mode. */
export const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
export const HAS_GOOGLE_KEY = GOOGLE_API_KEY.length > 0;

/** Used when GPS is unavailable or permission is denied. */
export const DEFAULT_LOCATION: LatLng = { latitude: 51.9607, longitude: 7.6261 }; // Münster
export const DEFAULT_LOCATION_NAME = "Münster";

/** Facilities within this distance of the route are shown as "on your route". */
export const ROUTE_CORRIDOR_KM = 25;

/** Every DriverConnect facility is compact: 10–20 truck spaces. Never more than 20. */
export const MIN_SPACES_PER_FACILITY = 10;
export const MAX_SPACES_PER_FACILITY = 20;

/** Places inside a facility = parking spaces + at least this many extra places (for "Entry Only" visitors). */
export const MIN_EXTRA_INSIDE_PLACES = 4;

/** A space counts as "almost full" at or below this many free spaces. */
export const ALMOST_FULL_THRESHOLD = 3;

/** QR entry is accepted from this many minutes before arrival. */
export const ENTRY_EARLY_MINUTES = 30;

/** Fallback route estimate (no Google key): road factor and average truck speed. */
export const ESTIMATE_ROAD_FACTOR = 1.25;
export const ESTIMATE_TRUCK_SPEED_KMH = 72;
