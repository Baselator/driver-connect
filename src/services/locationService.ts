import * as Location from "expo-location";
import { DEFAULT_LOCATION } from "@/config/appConfig";
import type { LatLng } from "@/models/types";

export interface LocationFix {
  coordinate: LatLng;
  source: "gps" | "default";
  reason?: string;
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

/** Asks for permission and returns the GPS position – or Münster if anything fails. */
export async function getCurrentLocation(): Promise<LocationFix> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { coordinate: DEFAULT_LOCATION, source: "default", reason: "Location permission denied" };
    const pos = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 10_000);
    return { coordinate: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, source: "gps" };
  } catch {
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) return { coordinate: { latitude: last.coords.latitude, longitude: last.coords.longitude }, source: "gps" };
    } catch {
      // ignore – fall through to default
    }
    return { coordinate: DEFAULT_LOCATION, source: "default", reason: "GPS unavailable" };
  }
}
