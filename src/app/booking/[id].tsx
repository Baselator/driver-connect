import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookingQR } from "@/components/BookingQR";
import { PAYMENT_STYLE, PHASE_STYLE } from "@/components/BookingCard";
import { Countdown } from "@/components/Countdown";
import { ScanResultModal } from "@/components/ScanResultModal";
import { Button, Card, Divider, EmptyState, Icon, Pill, SectionTitle } from "@/components/ui";
import { BUNDLES } from "@/config/pricing";
import { colors, radius, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useNow } from "@/hooks/useNow";
import type { ScanResult } from "@/models/types";
import { encodeQr } from "@/services/accessService";
import { useEndBooking } from "@/hooks/useEndBooking";
import { bookingPhase, canEnd, previewEnd } from "@/services/bookingService";
import { getFacilityById } from "@/services/facilityService";
import { formatDateTime, formatEUR } from "@/utils/format";

export default function BookingDetailScreen() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { bookings, scanEntry } = useApp();
  const endBooking = useEndBooking();
  const now = useNow(5000);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <EmptyState icon="ticket-outline" title="Booking not found" message="It may have been removed by a demo reset." />;

  const phase = bookingPhase(booking, now);
  const ps = PHASE_STYLE[phase];
  const pay = PAYMENT_STYLE[booking.paymentStatus];
  const def = BUNDLES[booking.bundle];
  const facility = getFacilityById(booking.facilityId);
  const canScan = phase === "upcoming" || phase === "active";

  const simulate = async () => {
    setBusy(true);
    setScan(await scanEntry(encodeQr(booking)));
    setBusy(false);
  };

  const endable = canEnd(booking, now);
  const endInfo = previewEnd(booking, now);

  const navigate = () => {
    if (!facility) return;
    const { latitude, longitude } = facility.coordinate;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${latitude},${longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {fresh ? (
          <View style={styles.success}>
            <Icon name="check-decagram" size={30} color={colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Booking confirmed!</Text>
              <Text style={styles.successText}>Payment of {formatEUR(booking.amount)} approved (simulated).</Text>
            </View>
          </View>
        ) : null}

        <Card style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: spacing.md }}>
            <Pill label={ps.label} color={ps.color} bg={ps.bg} icon={ps.icon} />
            <Pill label={pay.label} color={pay.color} bg={pay.bg} />
          </View>
          <BookingQR booking={booking} size={210} />
          <Text style={styles.rid}>{booking.reservationId}</Text>
          <View style={styles.tokenRow}>
            <Icon
              name={booking.tokenUsedAt ? "qrcode-remove" : "qrcode-scan"}
              size={18}
              color={booking.tokenUsedAt ? colors.textMuted : colors.tealDark}
            />
            <Text style={[type.small, { color: booking.tokenUsedAt ? colors.textMuted : colors.tealDark, fontWeight: "700" }]}>
              {booking.status === "cancelled"
                ? "QR code void"
                : booking.checkedOutAt
                  ? `Checked out ${formatDateTime(booking.checkedOutAt)}`
                  : booking.tokenUsedAt
                  ? `Entry used ${formatDateTime(booking.tokenUsedAt)}`
                  : "One-time entry code · unused"}
            </Text>
          </View>
          <Text style={[type.tiny, { textAlign: "center", marginTop: 4 }]}>Show this code at the entrance gate.</Text>
        </Card>

        {def.includesParking && canScan ? (
          <View style={{ marginTop: spacing.md }}>
            <Countdown booking={booking} large />
          </View>
        ) : null}

        <SectionTitle>Details</SectionTitle>
        <Card>
          <Line label="Facility" value={booking.facilityName} />
          <Line label="Bundle" value={def.title} />
          <Line label="Access from" value={formatDateTime(booking.startAt)} />
          <Line label="Access until" value={formatDateTime(booking.endAt)} />
          {booking.checkedOutAt ? (
            <Line label="Left early" value={`${formatDateTime(booking.checkedOutAt)} (booked until ${formatDateTime(booking.bookedEndAt ?? booking.endAt)})`} />
          ) : null}
          <Line label="Parking" value={def.includesParking ? `Reserved until ${formatDateTime(booking.endAt)}` : "Not included"} />
          <Line label="Vehicle" value={booking.vehiclePlate} />
          <Divider />
          <Line label="Amount" value={formatEUR(booking.amount)} />
          <Line label="Paid with" value={booking.paymentMethodLabel} />
          {booking.refundedAmount ? <Line label="Refunded" value={formatEUR(booking.refundedAmount)} /> : null}
          <Line label="Booked on" value={formatDateTime(booking.createdAt)} />
        </Card>

        {endable ? (
          <>
            <SectionTitle>{endInfo.kind === "cancel" ? "Changed your plans?" : "Leaving earlier?"}</SectionTitle>
            <Card style={{ gap: spacing.sm }}>
              <Text style={type.small}>
                {endInfo.kind === "cancel"
                  ? "You haven't entered yet. Cancel now for a full refund – the space is freed immediately."
                  : "Leave whenever you want: your stay ends right away and the space is freed for other drivers. You can then book another facility."}
                {endInfo.kind === "checkout" && endInfo.refund > 0 ? ` Refund for unused hours: ${formatEUR(endInfo.refund)}.` : ""}
              </Text>
              <Button
                title={endInfo.kind === "cancel" ? "Cancel booking" : "Leave now (check out)"}
                icon={endInfo.kind === "cancel" ? "close-circle-outline" : "exit-run"}
                variant="danger"
                onPress={() => endBooking(booking)}
              />
            </Card>
          </>
        ) : null}

        {canScan && !booking.tokenUsedAt ? (
          <>
            <SectionTitle>Entrance (demo)</SectionTitle>
            <Card style={{ gap: spacing.sm }}>
              <Text style={type.small}>
                Test the one-time QR access. The first valid scan opens the gate; every later scan of the same code is rejected.
              </Text>
              <Button title="Simulate entrance scan" icon="qrcode-scan" variant="teal" onPress={simulate} loading={busy} />
              <Button title="Open camera scanner" icon="camera-outline" variant="ghost" onPress={() => router.push("/scan")} />
            </Card>
          </>
        ) : null}

        <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
          <Button title="Navigate to facility" icon="navigation-variant-outline" variant="secondary" onPress={navigate} />
          <Button
            title="View receipt"
            icon="receipt"
            variant="ghost"
            onPress={() => router.push({ pathname: "/account/receipt/[id]", params: { id: booking.transactionId } })}
          />
        </View>
      </ScrollView>
      <ScanResultModal result={scan} onClose={() => setScan(null)} />
    </SafeAreaView>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={[type.small, { width: 110 }]}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: 48 },
  success: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  successTitle: { color: colors.white, fontSize: 18, fontWeight: "800" },
  successText: { color: colors.white, fontSize: 14 },
  rid: { fontSize: 24, fontWeight: "900", color: colors.navy, letterSpacing: 1.5, marginTop: spacing.md },
  tokenRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  line: { flexDirection: "row", paddingVertical: 5 },
  lineValue: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
});
