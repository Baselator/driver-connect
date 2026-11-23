import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Local persistence (AsyncStorage). Every service reads/writes through here,
 * so swapping to a real backend later only means replacing the service functions.
 */
export const KEYS = {
  seeded: "dc:v1:seeded",
  profile: "dc:v1:profile",
  settings: "dc:v1:settings",
  paymentMethods: "dc:v1:paymentMethods",
  bookings: "dc:v1:bookings",
  transactions: "dc:v1:transactions",
  gateUsedTokens: "dc:v1:gateUsedTokens",
} as const;

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
