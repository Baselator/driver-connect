import { StyleSheet, Text, View } from "react-native";
import { BUNDLES } from "@/config/pricing";
import { colors, spacing, type } from "@/constants/theme";
import type { Booking, BookingPhase, PaymentStatus } from "@/models/types";
import { bookingPhase } from "@/services/bookingService";
import { formatEUR, formatPeriod } from "@/utils/format";
import { BookingQR } from "./BookingQR";
import { Countdown } from "./Countdown";
import { Card, Icon, Pill } from "./ui";

export const PHASE_STYLE: Record<BookingPhase, { label: string; color: string; bg: string; icon: string }> = {
  upcoming: { label: "Upcoming", color: colors.navy, bg: colors.navyLight, icon: "calendar-clock" },
  active: { label: "Active", color: colors.tealDark, bg: colors.tealLight, icon: "check-circle" },
  completed: { label: "Completed", color: "#6B747C", bg: colors.grayLight, icon: "check-all" },
  cancelled: { label: "Cancelled", color: colors.danger, bg: colors.dangerLight, icon: "close-circle" },
};

export const PAYMENT_STYLE: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: colors.tealDark, bg: colors.tealLight },
  refunded: { label: "Refunded", color: colors.orangeDark, bg: colors.orangeLight },
  pending: { label: "Pending", color: colors.navy, bg: colors.navyLight },
  failed: { label: "Failed", color: colors.danger, bg: colors.dangerLight },
};

export function BookingCard({ booking, onPress, now }: { booking: Booking; onPress: () => void; now: number }) {
  const phase = bookingPhase(booking, now);
  const ps = PHASE_STYLE[phase];
  const pay = PAYMENT_STYLE[booking.paymentStatus];
  const bundle = BUNDLES[booking.bundle];
  const showQr = phase === "upcoming" || phase === "active";

  return (
    <Card onPress={onPress}>
      <View style={styles.top}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            <Pill label={ps.label} color={ps.color} bg={ps.bg} icon={ps.icon} />
            <Pill label={pay.label} color={pay.color} bg={pay.bg} />
            {booking.checkedOutAt ? <Pill label="Left early" color={colors.orangeDark} bg={colors.orangeLight} icon="exit-run" /> : null}
          </View>
          <Text style={styles.name}>{booking.facilityName}</Text>
          <View style={styles.line}>
            <Icon name={bundle.icon} size={16} color={colors.textMuted} />
            <Text style={type.small}>{bundle.title}</Text>
          </View>
          <View style={styles.line}>
            <Icon name="calendar" size={16} color={colors.textMuted} />
            <Text style={type.small}>{formatPeriod(booking.startAt, booking.endAt)}</Text>
          </View>
          <Text style={styles.meta}>
            {booking.reservationId} · {formatEUR(booking.amount)}
          </Text>
        </View>
        {showQr ? <BookingQR booking={booking} size={72} /> : null}
      </View>
      {bundle.includesParking && showQr ? (
        <View style={{ marginTop: spacing.md }}>
          <Countdown booking={booking} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  name: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 4 },
  line: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 13, fontWeight: "600", color: colors.navy, marginTop: 4 },
});
