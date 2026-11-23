import { DEMO_PAYMENT_METHODS, DEMO_PROFILE, DEMO_SETTINGS } from "@/data/demoSeed";
import type { AppSettings, PaymentMethod, UserProfile } from "@/models/types";
import { KEYS, readJSON, writeJSON } from "./storage";

export const getProfile = () => readJSON<UserProfile>(KEYS.profile, DEMO_PROFILE);

export async function updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  const next = { ...(await getProfile()), ...patch };
  await writeJSON(KEYS.profile, next);
  return next;
}

export const getSettings = () => readJSON<AppSettings>(KEYS.settings, DEMO_SETTINGS);

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...patch };
  await writeJSON(KEYS.settings, next);
  return next;
}

export const getPaymentMethods = () => readJSON<PaymentMethod[]>(KEYS.paymentMethods, DEMO_PAYMENT_METHODS);

export async function setDefaultPaymentMethod(id: string): Promise<PaymentMethod[]> {
  const next = (await getPaymentMethods()).map((m) => ({ ...m, isDefault: m.id === id }));
  await writeJSON(KEYS.paymentMethods, next);
  return next;
}
