import {
  ESTIMATE_ROAD_FACTOR,
  ESTIMATE_TRUCK_SPEED_KMH,
  GOOGLE_API_KEY,
  HAS_GOOGLE_KEY,
  ROUTE_CORRIDOR_KM,
} from "@/config/appConfig";
import type { Facility, LatLng, RouteResult } from "@/models/types";
import { decodePolyline, distanceToRoute, haversineKm, interpolate } from "@/utils/geo";

/**
 * Route planning.
 * With a Google key → Google Routes API (standard DRIVE route).
 * Otherwise → straight-line estimate × road factor at average truck speed.
 * NOTE: neither is a guaranteed truck-safe route (height/weight limits are not considered).
 */
export async function computeRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  if (HAS_GOOGLE_KEY) {
    try {
      const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: { location: { latLng: origin } },
          destination: { location: { latLng: destination } },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
          units: "METRIC",
        }),
      });
      if (!res.ok) throw new Error(`Routes ${res.status}`);
      const json = (await res.json()) as {
        routes?: { duration: string; distanceMeters: number; polyline: { encodedPolyline: string } }[];
      };
      const r = json.routes?.[0];
      if (r) {
        return {
          coordinates: decodePolyline(r.polyline.encodedPolyline),
          distanceMeters: r.distanceMeters,
          durationSeconds: parseInt(r.duration, 10) || 0,
          source: "google",
        };
      }
    } catch (e) {
      if (__DEV__) console.warn("[DriverConnect] Routes API failed, using estimate.", e);
    }
  }
  const km = haversineKm(origin, destination) * ESTIMATE_ROAD_FACTOR;
  return {
    coordinates: interpolate(origin, destination, 60),
    distanceMeters: km * 1000,
    durationSeconds: (km / ESTIMATE_TRUCK_SPEED_KMH) * 3600,
    source: "estimate",
  };
}

export interface FacilityOnRoute {
  facility: Facility;
  detourKm: number;
  alongKm: number;
}

/** Facilities within the corridor around the route, ordered from start to destination. */
export function facilitiesAlongRoute(route: LatLng[], facilities: Facility[], corridorKm = ROUTE_CORRIDOR_KM): FacilityOnRoute[] {
  return facilities
    .map((f) => {
      const { km, alongKm } = distanceToRoute(f.coordinate, route);
      return { facility: f, detourKm: km, alongKm };
    })
    .filter((x) => x.detourKm <= corridorKm)
    .sort((a, b) => a.alongKm - b.alongKm);
}
