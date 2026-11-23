import type { LatLng } from "@/models/types";

const R = 6371; // km

const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance (km) from point p to segment a–b, using a local flat projection (fine for < 100 km). */
function pointToSegmentKm(p: LatLng, a: LatLng, b: LatLng): { km: number; t: number } {
  const kx = 111.32 * Math.cos(toRad(p.latitude));
  const ky = 110.57;
  const ax = (a.longitude - p.longitude) * kx;
  const ay = (a.latitude - p.latitude) * ky;
  const bx = (b.longitude - p.longitude) * kx;
  const by = (b.latitude - p.latitude) * ky;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return { km: Math.sqrt(cx * cx + cy * cy), t };
}

/**
 * Closest distance from a point to a polyline, plus how far along the route (km) that closest point is.
 */
export function distanceToRoute(p: LatLng, route: LatLng[]): { km: number; alongKm: number } {
  if (route.length === 0) return { km: Infinity, alongKm: 0 };
  if (route.length === 1) return { km: haversineKm(p, route[0]), alongKm: 0 };
  let best = Infinity;
  let bestAlong = 0;
  let along = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const segKm = haversineKm(route[i], route[i + 1]);
    const { km, t } = pointToSegmentKm(p, route[i], route[i + 1]);
    if (km < best) {
      best = km;
      bestAlong = along + t * segKm;
    }
    along += segKm;
  }
  return { km: best, alongKm: bestAlong };
}

/** Straight line split into n points (used for estimated routes). */
export function interpolate(a: LatLng, b: LatLng, n = 40): LatLng[] {
  const out: LatLng[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({
      latitude: a.latitude + (b.latitude - a.latitude) * t,
      longitude: a.longitude + (b.longitude - a.longitude) * t,
    });
  }
  return out;
}

/** Decodes a Google encoded polyline. */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export function boundsOf(coords: LatLng[]) {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  for (const c of coords) {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }
  return { minLat, maxLat, minLng, maxLng };
}
