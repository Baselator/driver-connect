import { BUNDLES, priceFor, refundForEarlyExit } from "@/config/pricing";
import type { Booking, BookingPhase, BundleType, Facility, PaymentMethod } from "@/models/types";
import { formatTime } from "@/utils/format";
import { newId, newQrToken, newReservationId } from "@/utils/id";
import { bundleBlocked, getAvailability } from "./availabilityService";
import { charge, refund } from "./paymentService";
import { KEYS, readJSON, writeJSON } from "./storage";
import { addTransaction, updateTransaction } from "./transactionService";

const HOUR = 3600_000;

export async function listBookings(): Promise<Booking[]> {
  return readJSON<Booking[]>(KEYS.bookings, []);
}

export async function saveBookings(list: Booking[]): Promise<void> {
  await writeJSON(KEYS.bookings, list);
}

export async function updateBooking(id: string, patch: Partial<Booking>): Promise<Booking | undefined> {
  const list = await listBookings();
  let updated: Booking | undefined;
  const next = list.map((b) => {
    if (b.id !== id) return b;
    updated = { ...b, ...patch };
    return updated;
  });
  await saveBookings(next);
  return updated;
}

/** Upcoming / Active / Completed / Cancelled – calculated from stored timestamps. */
export function bookingPhase(b: Booking, now = Date.now()): BookingPhase {
  if (b.status === "cancelled") return "cancelled";
  if (b.checkedOutAt) return "completed"; // driver left early
  if (now < b.startAt) return "upcoming";
  if (now < b.endAt) return "active";
  return "completed";
}

/** Bookings always start right now (rounded down to the minute). No future reservations. */
export function currentMinute(now = Date.now()): number {
  return Math.floor(now / 60_000) * 60_000;
}

/**
 * A driver can only hold ONE booking at a time: returns the confirmed booking that is still
 * running (or not yet started) and therefore blocks a new booking.
 */
export function findBlockingBooking(bookings: Booking[], now = Date.now()): Booking | undefined {
  return bookings.find((b) => b.status === "confirmed" && !b.checkedOutAt && b.endAt > now);
}

export function blockingMessage(b: Booking): string {
  return `You already have a booking (${b.reservationId}) at ${b.facilityName} until ${formatTime(b.endAt)}. ${
    b.tokenUsedAt ? "Leave (check out) there" : "Cancel it"
  } to book this place instead.`;
}

export interface CreateBookingInput {
  facility: Facility;
  bundle: BundleType;
  hours: number;
  paymentMethod: PaymentMethod;
  vehiclePlate: string;
}

export type CreateBookingResult = { ok: true; booking: Booking } | { ok: false; error: string };

/**
 * Full booking flow: re-check availability → simulated payment → save booking + transaction.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { facility, bundle, hours, paymentMethod } = input;
  const def = BUNDLES[bundle];
  // Present bookings only – the booking starts at this exact moment (not rounded, so a booking
  // made right after leaving another facility never "overlaps" the stay that just ended).
  const startAt = Date.now();
  const endAt = startAt + hours * HOUR;
  const existing = await listBookings();

  // 1. One booking at a time: no booking while another one is active or overlaps this period.
  const blocking =
    findBlockingBooking(existing) ??
    existing.find((b) => b.status === "confirmed" && b.startAt < endAt && b.endAt > startAt);
  if (blocking) return { ok: false, error: blockingMessage(blocking) };

  // 2. Availability right now (checked again in case something changed since the user looked).
  const av = getAvailability(facility, startAt, endAt, existing);
  if (bundleBlocked(bundle, av)) {
    return {
      ok: false,
      error: def.includesParking
        ? "No parking spaces are free right now. You can still book Facility Entry Only."
        : "All places for Facility Entry Only visitors are taken right now. Please try again later.",
    };
  }

  // 3. Simulated payment.
  const amount = priceFor(bundle, hours);
  const payment = await charge(paymentMethod, amount);
  if (!payment.success) return { ok: false, error: payment.message };

  // 4. Save booking + transaction.
  const now = Date.now();
  const booking: Booking = {
    id: newId("bk"),
    reservationId: newReservationId(),
    facilityId: facility.id,
    facilityName: facility.name,
    bundle,
    startAt,
    endAt,
    hours,
    createdAt: now,
    amount,
    currency: "EUR",
    paymentMethodId: paymentMethod.id,
    paymentMethodLabel: paymentMethod.label,
    paymentStatus: "paid",
    status: "confirmed",
    qrToken: newQrToken(),
    tokenUsedAt: null,
    transactionId: newId("tx"),
    vehiclePlate: input.vehiclePlate,
  };
  await saveBookings([booking, ...existing]);
  await addTransaction({
    id: booking.transactionId,
    createdAt: now,
    facilityId: facility.id,
    facilityName: facility.name,
    bundle,
    description: bundle === "shortTerm" ? `${def.title} (${hours} h)` : def.title,
    amount,
    currency: "EUR",
    status: "paid",
    paymentMethodLabel: paymentMethod.label,
    bookingId: booking.id,
    reservationId: booking.reservationId,
  });
  return { ok: true, booking };
}

/** A running booking (not ended, not cancelled) can always be ended by the driver. */
export function canEnd(b: Booking, now = Date.now()): boolean {
  const phase = bookingPhase(b, now);
  return phase === "upcoming" || phase === "active";
}

export interface EndPreview {
  kind: "cancel" | "checkout";
  refund: number;
  title: string;
  message: string;
  button: string;
}

/**
 * What happens if the driver ends this booking now:
 *  - not entered yet  → "cancel": booking cancelled, full refund;
 *  - already entered  → "checkout": stay ends now, space is freed, unused short-term hours refunded.
 * In both cases the driver can immediately book another facility.
 */
export function previewEnd(b: Booking, now = Date.now()): EndPreview {
  if (b.tokenUsedAt == null) {
    return {
      kind: "cancel",
      refund: b.amount,
      title: "Cancel booking?",
      message: `You haven't entered yet, so ${b.reservationId} is cancelled and €${b.amount.toFixed(2)} refunded (simulated). The space is freed immediately.`,
      button: "Cancel booking",
    };
  }
  const refundAmount = refundForEarlyExit(b.bundle, b.endAt - now);
  return {
    kind: "checkout",
    refund: refundAmount,
    title: "Leave now?",
    message:
      `Your stay at ${b.facilityName} ends now and your space is freed for other drivers. ` +
      (refundAmount > 0
        ? `€${refundAmount.toFixed(2)} for unused parking hours is refunded (simulated).`
        : "No refund: this bundle has a flat price and you have already entered.") +
      " You can book another facility right away.",
    button: "Leave now",
  };
}

/** End a running booking now (cancel before entering, or check out early after entering). */
export async function endBooking(id: string): Promise<{ ok: boolean; kind?: EndPreview["kind"]; refund?: number; error?: string }> {
  const b = (await listBookings()).find((x) => x.id === id);
  if (!b) return { ok: false, error: "Booking not found." };
  if (!canEnd(b)) return { ok: false, error: "This booking has already ended." };
  const now = Date.now();
  const preview = previewEnd(b, now);

  if (preview.kind === "cancel") {
    await refund(b.paymentMethodLabel, b.amount);
    await updateBooking(id, { status: "cancelled", paymentStatus: "refunded", refundedAmount: b.amount });
    await updateTransaction(b.transactionId, { status: "refunded" });
    return { ok: true, kind: "cancel", refund: b.amount };
  }

  // Early check-out: the booking ends now, so the space (and the driver) are free again.
  await updateBooking(id, {
    endAt: now,
    bookedEndAt: b.bookedEndAt ?? b.endAt,
    checkedOutAt: now,
    refundedAmount: preview.refund,
  });
  if (preview.refund > 0) {
    await refund(b.paymentMethodLabel, preview.refund);
    await addTransaction({
      id: newId("tx"),
      createdAt: now,
      facilityId: b.facilityId,
      facilityName: b.facilityName,
      bundle: b.bundle,
      description: `Refund – unused parking (left early)`,
      amount: -preview.refund,
      currency: "EUR",
      status: "refunded",
      paymentMethodLabel: b.paymentMethodLabel,
      bookingId: b.id,
      reservationId: b.reservationId,
    });
  }
  return { ok: true, kind: "checkout", refund: preview.refund };
}
