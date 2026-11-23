import { ENTRY_EARLY_MINUTES } from "@/config/appConfig";
import type { Booking, ScanResult } from "@/models/types";
import { formatDateTime } from "@/utils/format";
import { demoHash } from "@/utils/id";
import { listBookings, updateBooking } from "./bookingService";
import { KEYS, readJSON, writeJSON } from "./storage";

/**
 * QR ACCESS – PROTOTYPE ONLY.
 *
 * The QR code holds the reservation ID, a one-time token, the access period and a simple checksum.
 * Validation happens locally on this device:
 *   - If the booking is stored on this phone, its record is checked and marked as used.
 *   - If another phone acts as the "entrance gate", it validates the QR data itself and keeps
 *     its own list of used tokens, so the same code is still rejected the second time.
 *
 * PRODUCTION: the gate must ask a secure backend, which issues server-signed tokens and marks
 * them as used in one atomic operation. Never trust a checksum made on the phone.
 */

const PREFIX = "DCQR1";
const DEMO_SECRET = "driverconnect-demo"; // not a real secret – demo only

interface QrPayload {
  rid: string;
  tok: string;
  fid: string;
  fn: string;
  s: number;
  e: number;
  sig: string;
}

function sign(p: Omit<QrPayload, "sig">) {
  return demoHash(`${p.rid}|${p.tok}|${p.fid}|${p.s}|${p.e}|${DEMO_SECRET}`);
}

export function encodeQr(b: Booking): string {
  const base = { rid: b.reservationId, tok: b.qrToken, fid: b.facilityId, fn: b.facilityName, s: b.startAt, e: b.endAt };
  return `${PREFIX}:${JSON.stringify({ ...base, sig: sign(base) })}`;
}

function decodeQr(data: string): QrPayload | null {
  if (!data.startsWith(`${PREFIX}:`)) return null;
  try {
    const p = JSON.parse(data.slice(PREFIX.length + 1)) as QrPayload;
    if (!p.rid || !p.tok || typeof p.s !== "number" || typeof p.e !== "number") return null;
    const { sig, ...rest } = p;
    return sign(rest) === sig ? p : null;
  } catch {
    return null;
  }
}

const fail = (code: ScanResult["code"], title: string, message: string, p?: QrPayload): ScanResult => ({
  ok: false,
  code,
  title,
  message,
  reservationId: p?.rid,
  facilityName: p?.fn,
});

/**
 * Validate a scanned QR code and, if valid, mark it as used immediately.
 * @param scanTime pass a simulated time to test (e.g. the booking's arrival time).
 */
export async function validateEntryScan(data: string, scanTime = Date.now()): Promise<ScanResult> {
  const p = decodeQr(data);
  if (!p) return fail("invalid", "Invalid code", "This is not a valid DriverConnect booking QR code.");

  const booking = (await listBookings()).find((b) => b.reservationId === p.rid);
  const gateUsed = await readJSON<Record<string, number>>(KEYS.gateUsedTokens, {});

  if (booking) {
    if (booking.qrToken !== p.tok) return fail("invalid", "Invalid code", "The token does not match this reservation.", p);
    if (booking.status === "cancelled") return fail("cancelled", "Booking cancelled", "This reservation was cancelled and refunded.", p);
    if (booking.checkedOutAt) {
      return fail("expired", "Checked out", `This booking ended when the driver left on ${formatDateTime(booking.checkedOutAt)}.`, p);
    }
  }
  const endAt = booking?.endAt ?? p.e;

  const usedAt = booking?.tokenUsedAt ?? gateUsed[p.tok];
  if (usedAt) {
    return fail("already_used", "Code already used", `This one-time code was used on ${formatDateTime(usedAt)}. Entry denied.`, p);
  }

  const earliest = p.s - ENTRY_EARLY_MINUTES * 60_000;
  if (scanTime < earliest) {
    return fail("too_early", "Too early", `Entry opens ${ENTRY_EARLY_MINUTES} min before arrival: ${formatDateTime(earliest)}.`, p);
  }
  if (scanTime > endAt) return fail("expired", "Booking expired", `The access period ended on ${formatDateTime(endAt)}.`, p);

  // Valid → mark as used immediately (both on the booking and in the gate list).
  gateUsed[p.tok] = scanTime;
  await writeJSON(KEYS.gateUsedTokens, gateUsed);
  if (booking) await updateBooking(booking.id, { tokenUsedAt: scanTime });

  return {
    ok: true,
    code: "granted",
    title: "Access granted",
    message: `Welcome! Reservation ${p.rid} is valid until ${formatDateTime(endAt)}.`,
    reservationId: p.rid,
    facilityName: p.fn,
  };
}
