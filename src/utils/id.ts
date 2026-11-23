const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(length: number, alphabet = ALPHABET): string {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${randomString(4).toLowerCase()}`;

/** Human-friendly reservation ID, e.g. DC-7Q4K2M. */
export const newReservationId = () => `DC-${randomString(6)}`;

/** One-time QR entry token (demo only – a real backend would issue a signed token). */
export const newQrToken = () => randomString(20, "abcdefghijklmnopqrstuvwxyz0123456789");

/** Tiny non-cryptographic hash (djb2) used for the demo QR checksum. */
export function demoHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}
