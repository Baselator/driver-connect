import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PAYMENT_STYLE } from "@/components/BookingCard";
import { Logo } from "@/components/Logo";
import { Card, Divider, EmptyState, Pill } from "@/components/ui";
import { BUNDLES } from "@/config/pricing";
import { colors, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getFacilityById } from "@/services/facilityService";
import { formatDateLong, formatDateTime, formatEUR, formatPeriod } from "@/utils/format";

const VAT = 0.19;

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, bookings, profile } = useApp();
  const tx = transactions.find((t) => t.id === id);
  if (!tx) return <EmptyState icon="receipt" title="Receipt not found" message="This transaction does not exist." />;

  const booking = bookings.find((b) => b.id === tx.bookingId);
  const facility = getFacilityById(tx.facilityId);
  const net = tx.amount / (1 + VAT);
  const ps = PAYMENT_STYLE[tx.status];

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
      <Card>
        <View style={styles.head}>
          <Logo size={30} />
          <Pill label={ps.label} color={ps.color} bg={ps.bg} />
        </View>
        <Text style={[type.h2, { marginTop: spacing.lg }]}>Receipt</Text>
        <Text style={type.small}>{formatDateLong(tx.createdAt)}</Text>

        <Divider />
        <Line label="Receipt no." value={tx.id.toUpperCase()} />
        {tx.reservationId ? <Line label="Reservation" value={tx.reservationId} /> : null}
        <Line label="Facility" value={tx.facilityName} />
        {facility ? <Line label="Address" value={facility.address} /> : null}
        <Line label="Bundle" value={BUNDLES[tx.bundle].title} />
        {booking ? <Line label="Period" value={formatPeriod(booking.startAt, booking.endAt)} /> : null}
        <Line label="Customer" value={`${profile.name}\n${profile.email}`} />
        <Line label="Paid with" value={tx.paymentMethodLabel} />
        <Line label="Date" value={formatDateTime(tx.createdAt)} />

        <Divider />
        <Line label="Net" value={formatEUR(net)} />
        <Line label="VAT 19 %" value={formatEUR(tx.amount - net)} />
        <View style={styles.totalRow}>
          <Text style={type.h3}>Total</Text>
          <Text style={styles.total}>{formatEUR(tx.amount)}</Text>
        </View>
        {tx.status === "refunded" ? <Text style={[type.small, { color: colors.orangeDark }]}>This amount was refunded (simulated).</Text> : null}
        <Text style={[type.tiny, { marginTop: spacing.lg, textAlign: "center" }]}>
          Demo receipt – simulated payment, no real money was charged.
        </Text>
      </Card>
    </ScrollView>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={[type.small, { width: 100 }]}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  line: { flexDirection: "row", paddingVertical: 4 },
  lineValue: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  total: { fontSize: 26, fontWeight: "900", color: colors.navy },
});
