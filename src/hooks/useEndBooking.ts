import { useApp } from "@/context/AppContext";
import type { Booking } from "@/models/types";
import { previewEnd } from "@/services/bookingService";
import { confirmAction, notify } from "@/utils/confirm";

/**
 * Returns a function that asks "Cancel booking?" (not entered yet) or "Leave now?" (already inside),
 * then ends the booking. Afterwards the space is free and the driver can book another facility.
 */
export function useEndBooking() {
  const { endBooking } = useApp();
  return (booking: Booking, onDone?: () => void) => {
    const p = previewEnd(booking);
    confirmAction(p.title, p.message, p.button, async () => {
      const res = await endBooking(booking.id);
      if (!res.ok) {
        notify("Could not end booking", res.error ?? "");
        return;
      }
      notify(
        res.kind === "cancel" ? "Booking cancelled" : "You have checked out",
        (res.refund ?? 0) > 0
          ? `€${(res.refund ?? 0).toFixed(2)} will be refunded (simulated). You can now book another place.`
          : "Your space is free again. You can now book another place.",
      );
      onDone?.();
    });
  };
}
