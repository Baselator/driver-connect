import { GOOGLE_API_KEY, HAS_GOOGLE_KEY } from "@/config/appConfig";
import { LOCAL_PLACES } from "@/data/places";
import type { LatLng, PlaceResult } from "@/models/types";

/**
 * Destination search.
 * With a Google key → Google Places API (New) autocomplete.
 * Without a key (or on error) → offline list of European logistics cities.
 */

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function searchLocal(query: string): PlaceResult[] {
  const q = normalize(query.trim());
  if (!q) return LOCAL_PLACES.slice(0, 8);
  const alt = q.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
  return LOCAL_PLACES.filter((p) => {
    const n = normalize(p.title);
    const nAlt = n.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
    return n.includes(q) || nAlt.includes(alt);
  })
    .sort((a, b) => Number(normalize(b.title).startsWith(q)) - Number(normalize(a.title).startsWith(q)))
    .slice(0, 10);
}

interface GoogleSuggestion {
  placePrediction?: {
    placeId: string;
    text?: { text: string };
    structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
  };
}

export async function searchPlaces(query: string, near?: LatLng): Promise<PlaceResult[]> {
  if (!HAS_GOOGLE_KEY || query.trim().length < 2) return searchLocal(query);
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_API_KEY },
      body: JSON.stringify({
        input: query,
        languageCode: "en",
        includedRegionCodes: ["de", "nl", "be", "at", "ch", "pl", "cz", "dk", "fr", "lu"],
        ...(near && { locationBias: { circle: { center: near, radius: 50000 } } }),
      }),
    });
    if (!res.ok) throw new Error(`Places ${res.status}`);
    const json = (await res.json()) as { suggestions?: GoogleSuggestion[] };
    const results: PlaceResult[] = (json.suggestions ?? [])
      .filter((s) => s.placePrediction)
      .map((s) => {
        const p = s.placePrediction!;
        return {
          id: p.placeId,
          title: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "Place",
          subtitle: p.structuredFormat?.secondaryText?.text ?? "",
          source: "google" as const,
        };
      });
    return results.length ? results : searchLocal(query);
  } catch (e) {
    if (__DEV__) console.warn("[DriverConnect] Places search failed, using offline list.", e);
    return searchLocal(query);
  }
}

/** Google results don't include coordinates – fetch them when the user picks one. */
export async function resolvePlace(place: PlaceResult): Promise<LatLng | null> {
  if (place.coordinate) return place.coordinate;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${place.id}`, {
      headers: { "X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": "location" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { location?: LatLng };
    return json.location ?? null;
  } catch {
    return null;
  }
}
