import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PaymentIcon } from "@/components/PaymentIcon";
import { Button, Card, Divider, EmptyState, Icon, SectionTitle } from "@/components/ui";
import { BUNDLES, priceBreakdown, priceFor } from "@/config/pricing";
import { colors, radius, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import type { BundleType } from "@/models/types";
import { useNow } from "@/hooks/useNow";
import { bundleBlocked, getAvailability } from "@/services/availabilityService";
import { blockingMessage, currentMinute, findBlockingBooking } from "@/services/bookingService";
import { getFacilityById } from "@/services/facilityService";
import { formatDateTime, formatEUR } from "@/utils/format";

/** Steps 5–9: summary → payment method → simulated payment → save → QR. */
export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ id: string; bundle: BundleType; hours: string }>();
  const facility = getFacilityById(String(params.id));
  const bundle = (params.bundle ?? "overnight") as BundleType;
  const now = useNow(10_000);
  const startAt = currentMinute(now); // the booking starts at the moment you pay
  const hours = Number(params.hours);
  const { paymentMethods, bookings, createBooking, profile } = useApp();

  const [methodId, setMethodId] = useState(() => paymentMethods.find((m) => m.isDefault)?.id ?? paymentMethods[0]?.id);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!facility || !BUNDLES[bundle] || !hours) {
    return <EmptyState icon="alert-circle-outline" title="Something went wrong" message="Please start the booking again." />;
  }

  const def = BUNDLES[bundle];
  const endAt = startAt + hours * 3600_000;
  const amount = priceFor(bundle, hours);
  const av = getAvailability(facility, now, now + hours * 3600_000, bookings);
  const blocking = findBlockingBooking(bookings, now);
  const stillAvailable = !bundleBlocked(bundle, av) && !blocking;
  const method = paymentMethods.find((m) => m.id === methodId);

  const pay = async () => {
    if (!method) return;
    setError(null);
    setPaying(true);
    const res = await createBooking({ facility, bundle, hours, paymentMethod: method });
    setPaying(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (router.canDismiss()) router.dismissAll();
    router.push({ pathname: "/booking/[id]", params: { id: res.booking.id, fresh: "1" } });
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.h2}>Booking summary</Text>
        <Card style={{ marginTop: spacing.md }}>
          <Row icon="map-marker" label="Facility" value={facility.name} />
          <Row icon={def.icon} label="Bundle" value={def.title} />
          <Row icon="login" label="Arrival" value={`Right now · ${formatDateTime(startAt)}`} />
          <Row icon="logout" label="Departure" value={formatDateTime(endAt)} />
          <Row icon="clock-outline" label="Duration" value={`${hours} h`} />
          <Row icon="truck" label="Vehicle" value={profile.truckPlate} />
          <Row
            icon="parking"
            label="Parking"
            value={def.includesParking ? `1 reserved truck space (${av.parkingAvailable} free)` : "Not included"}
          />
          <Divider />
          {priceBreakdown(bundle, hours).map((l) => (
            <View key={l.label} style={styles.priceLine}>
              <Text style={type.small}>{l.label}</Text>
              <Text style={styles.priceValue}>{formatEUR(l.amount)}</Text>
            </View>
          ))}
          <View style={[styles.priceLine, { marginTop: 6 }]}>
            <Text style={type.h3}>Total (incl. VAT)</Text>
            <Text style={styles.total}>{formatEUR(amount)}</Text>
          </View>
          <Text style={type.tiny}>Healthy food & drinks are not included and can be bought on site.</Text>
        </Card>

        {!stillAvailable ? (
          <Card style={{ marginTop: spacing.md, backgroundColor: colors.dangerLight }}>
            <Text style={{ color: colors.danger, fontWeight: "700" }}>
              {blocking ? blockingMessage(blocking) : "This is no longer available right now. Go back and choose another bundle."}
            </Text>
          </Card>
        ) : null}

        <SectionTitle>Payment method</SectionTitle>
        <View style={{ gap: spacing.sm }}>
          {paymentMethods.map((m) => {
            const sel = m.id === methodId;
            return (
              <Pressable key={m.id} onPress={() => setMethodId(m.id)} style={[styles.method, sel && styles.methodSelected]}>
                <PaymentIcon type={m.type} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={type.tiny}>
                    {m.detail}
                    {m.isDefault ? " · Default" : ""}
                  </Text>
                </View>
                <Icon name={sel ? "radiobox-marked" : "radiobox-blank"} color={sel ? colors.navy : colors.gray} size={26} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.demoNote}>
          <Icon name="shield-check-outline" size={18} color={colors.navy} />
          <Text style={[type.tiny, { flex: 1 }]}>
            Demo mode: this is a simulated payment. No money is charged and no card details are collected.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Pay ${formatEUR(amount)}`}
          icon="lock-outline"
          onPress={pay}
          disabled={!method || !stillAvailable}
          loading={paying}
        />
      </View>

      <Modal visible={paying} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.processing}>
            <ActivityIndicator size="large" color={colors.navy} />
            <Text style={[type.h3, { marginTop: spacing.md }]}>Processing payment…</Text>
            <Text style={type.small}>{method?.label} · simulated</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={colors.textMuted} />
      <Text style={[type.small, { width: 84 }]}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: 40 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingVertical: 6 },
  rowValue: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  priceLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 },
  priceValue: { fontSize: 15, fontWeight: "600", color: colors.text },
  total: { fontSize: 24, fontWeight: "900", color: colors.navy },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  methodSelected: { borderColor: colors.navy },
  methodLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  demoNote: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: spacing.md },
  error: { color: colors.danger, fontWeight: "700", marginTop: spacing.md },
  footer: { padding: spacing.lg, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  overlay: { flex: 1, backgroundColor: "rgba(17,53,78,0.45)", alignItems: "center", justifyContent: "center" },
  processing: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center", width: 280 },
});
