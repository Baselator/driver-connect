import { buildDemoHistory, DEMO_PAYMENT_METHODS, DEMO_PROFILE, DEMO_SETTINGS } from "@/data/demoSeed";
import { KEYS, readJSON, removeAll, writeJSON } from "./storage";

/** Writes the demo user, payment methods and example history the first time the app starts. */
export async function ensureSeeded(): Promise<void> {
  const seeded = await readJSON<boolean>(KEYS.seeded, false);
  if (seeded) return;
  const { bookings, transactions } = buildDemoHistory(Date.now());
  await writeJSON(KEYS.profile, DEMO_PROFILE);
  await writeJSON(KEYS.settings, DEMO_SETTINGS);
  await writeJSON(KEYS.paymentMethods, DEMO_PAYMENT_METHODS);
  await writeJSON(KEYS.bookings, bookings);
  await writeJSON(KEYS.transactions, transactions);
  await writeJSON(KEYS.gateUsedTokens, {});
  await writeJSON(KEYS.seeded, true);
}

/** Deletes everything stored on the device and restores the original demo data. */
export async function resetDemoData(): Promise<void> {
  await removeAll();
  await ensureSeeded();
}
