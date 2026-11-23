import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { DurationSelector } from "@/components/DurationSelector";
import { Logo } from "@/components/Logo";
import { Button, Card, EmptyState, Icon, SectionTitle } from "@/components/ui";
import { BUNDLE_ORDER, BUNDLES, priceFor } from "@/config/pricing";
import { colors, radius, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { CORE_AMENITIES, EXTRA_AMENITIES } from "@/data/facilities";
import { useNow } from "@/hooks/useNow";
import type { BundleType } from "@/models/types";
import { bundleBlocked, getAvailability, getCurrentAvailability } from "@/services/availabilityService";
import { blockingMessage, currentMinute, findBlockingBooking, previewEnd } from "@/services/bookingService";
import { useEndBooking } from "@/hooks/useEndBooking";
import { getFacilityById } from "@/services/facilityService";
import { formatDistance, formatEUR, formatTime } from "@/utils/format";
import { haversineKm } from "@/utils/geo";

const HOUR = 3600_000;

export default function FacilityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const facility = getFacilityById(String(id));
  const { bookings, userLocation } = useApp();
  const now = useNow(10_000); // availability is refreshed every 10 seconds
  const startAt = currentMinute(now); // bookings always start right now

  const [bundle, setBundle] = useState<BundleType>("overnight");
  const [hours, setHours] = useState(BUNDLES.overnight.defaultDuration);

  const current = facility ? getCurrentAvailability(facility, bookings, now) : null;
  const blocking = findBlockingBooking(bookings, now);
  const endBooking = useEndBooking();

  // Availability of each bundle from now until the end of the chosen duration.
  const bundleAvailability = useMemo(() => {
    if (!facility) return null;
    return Object.fromEntries(
      BUNDLE_ORDER.map((b) => {
        const h = b === bundle ? hours : BUNDLES[b].defaultDuration;
        return [b, getAvailability(facility, now, now + h * HOUR, bookings)];
      }),
    ) as Record<BundleType, ReturnType<typeof getAvailability>>;
  }, [facility, bundle, hours, now, bookings]);

  if (!facility || !current || !bundleAvailability) {
    return <EmptyState icon="map-marker-off" title="Facility not found" message="This facility does not exist." />;
  }

  const isBlocked = (b: BundleType) => bundleBlocked(b, bundleAvailability[b]);
  const selectedAv = bundleAvailability[bundle];
  const blocked = isBlocked(bundle);
  const parkingFull = BUNDLES[bundle].includesParking && selectedAv.parkingAvailable <= 0;

  const chooseBundle = (b: BundleType) => {
    setBundle(b);
    setHours(BUNDLES[b].defaultDuration);
  };

  const goToCheckout = () =>
    router.push({ pathname: "/checkout/[id]", params: { id: facility.id, bundle, hours: String(hours) } });

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <Stack.Screen options={{ title: facility.city }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Logo size={72} />
        </View>

        <Text style={[type.h2, { marginTop: spacing.lg }]}>{facility.name}</Text>
        <View style={styles.metaRow}>
          <Icon name="road-variant" size={18} color={colors.textMuted} />
          <Text style={type.small}>
            {facility.motorway} · {facility.locationNote}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="map-marker-outline" size={18} color={colors.textMuted} />
          <Text style={type.small}>
            {facility.address} · {formatDistance(haversineKm(userLocation, facility.coordinate) * 1000)} away
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="star" size={18} color={colors.orange} />
          <Text style={type.small}>
            {facility.rating.toFixed(1)} · {facility.openingHours}
          </Text>
        </View>

        <View style={styles.availRow}>
          <AvailabilityBadge available={current.parkingAvailable} total={facility.totalSpaces} size="lg" />
          <View style={styles.smallBox}>
            <Icon name="account-group-outline" size={26} color={colors.navy} />
            <Text style={styles.smallBoxNum}>
              {current.entryAvailable} / {current.entryTotal}
            </Text>
            <Text style={type.tiny}>places inside free now</Text>
          </View>
        </View>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={type.tiny}>
            Live availability · updated {formatTime(now)} · {facility.entryCapacity} places inside for {facility.totalSpaces} truck spaces
          </Text>
        </View>

        {blocking ? (
          <Card style={{ backgroundColor: colors.orangeLight, marginTop: spacing.lg }}>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
              <Icon name="ticket-confirmation-outline" color={colors.orangeDark} />
              <View style={{ flex: 1 }}>
                <Text style={[type.h3, { color: colors.orangeDark }]}>You already have a booking</Text>
                <Text style={[type.small, { color: colors.navy, marginTop: 4 }]}>{blockingMessage(blocking)}</Text>
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap" }}>
                  <Button
                    title={previewEnd(blocking, now).kind === "cancel" ? "Cancel it" : "Leave & book here"}
                    icon={previewEnd(blocking, now).kind === "cancel" ? "close-circle-outline" : "exit-run"}
                    variant="danger"
                    small
                    onPress={() => endBooking(blocking)}
                  />
                  <Button
                    title="View booking"
                    variant="secondary"
                    small
                    onPress={() => router.push({ pathname: "/booking/[id]", params: { id: blocking.id } })}
                  />
                </View>
              </View>
            </View>
          </Card>
        ) : null}

        <SectionTitle>Amenities</SectionTitle>
        <View style={styles.amenityGrid}>
          {CORE_AMENITIES.map((a) => (
            <View key={a.key} style={styles.amenity}>
              <View style={styles.amenityIcon}>
                <Icon name={a.icon} size={22} color={colors.navy} />
              </View>
              <Text style={styles.amenityText}>{a.label}</Text>
            </View>
          ))}
          {facility.extras.map((e) => (
            <View key={e} style={styles.amenity}>
              <View style={[styles.amenityIcon, { backgroundColor: colors.tealLight }]}>
                <Icon name={EXTRA_AMENITIES[e].icon} size={22} color={colors.tealDark} />
              </View>
              <Text style={styles.amenityText}>{EXTRA_AMENITIES[e].label}</Text>
            </View>
          ))}
        </View>
        <Text style={type.tiny}>Healthy food & drinks are sold separately at the vending machines.</Text>

        <SectionTitle>1. Choose a bundle</SectionTitle>
        <View style={{ gap: spacing.md }}>
          {BUNDLE_ORDER.map((b) => {
            const def = BUNDLES[b];
            const sel = b === bundle;
            const dis = isBlocked(b);
            const av = bundleAvailability[b];
            const h = b === bundle ? hours : def.defaultDuration;
            return (
              <Pressable
                key={b}
                onPress={() => chooseBundle(b)}
                style={[styles.bundle, sel && styles.bundleSelected, dis && !sel && { opacity: 0.55 }]}
              >
                <View style={styles.bundleHeader}>
                  <View style={[styles.bundleIcon, sel && { backgroundColor: colors.navy }]}>
                    <Icon name={def.icon} color={sel ? colors.white : colors.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bundleTitle}>{def.title}</Text>
                    <Text style={styles.bundlePrice}>
                      {b === "shortTerm" ? `${formatEUR(priceFor(b, 1))} – ${formatEUR(priceFor(b, 4))}` : formatEUR(priceFor(b, h))}
                    </Text>
                  </View>
                  <Icon name={sel ? "radiobox-marked" : "radiobox-blank"} color={sel ? colors.navy : colors.gray} size={26} />
                </View>
                {def.features.map((f) => (
                  <View key={f} style={styles.feature}>
                    <Icon name="check" size={16} color={colors.teal} />
                    <Text style={type.small}>{f}</Text>
                  </View>
                ))}
                {dis ? (
                  <View style={styles.warn}>
                    <Icon name="alert-circle-outline" size={16} color={colors.danger} />
                    <Text style={styles.warnText}>
                      {def.includesParking && av.parkingAvailable <= 0
                        ? "No parking free right now"
                        : "All entry-only places are taken right now"}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>2. Duration</SectionTitle>
        <Card>
          <DurationSelector bundle={bundle} startAt={startAt} hours={hours} onChange={setHours} />
        </Card>

        <SectionTitle>3. Availability right now</SectionTitle>
        {blocked ? (
          <Card style={{ backgroundColor: colors.dangerLight }}>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
              <Icon name="close-octagon-outline" color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[type.h3, { color: colors.danger }]}>
                  {parkingFull ? "No parking available" : "Facility full"}
                </Text>
                <Text style={[type.small, { color: colors.danger, marginTop: 4 }]}>
                  {parkingFull
                    ? `All ${facility.totalSpaces} truck spaces are taken right now. Parking can't be booked, but you can still book Facility Entry Only (showers, gym, lounge, kitchen).`
                    : "All places for entry-only visitors are taken right now. Please try again in a little while."}
                </Text>
                {parkingFull && !isBlocked("entryOnly") ? (
                  <Button
                    title="Switch to Facility Entry Only"
                    variant="secondary"
                    small
                    style={{ marginTop: spacing.md }}
                    onPress={() => chooseBundle("entryOnly")}
                  />
                ) : null}
              </View>
            </View>
          </Card>
        ) : (
          <Card style={{ backgroundColor: colors.tealLight }}>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <Icon name="check-circle" color={colors.tealDark} size={28} />
              <View style={{ flex: 1 }}>
                <Text style={[type.h3, { color: colors.tealDark }]}>Available</Text>
                <Text style={[type.small, { color: colors.tealDark }]}>
                  {BUNDLES[bundle].includesParking
                    ? `${selectedAv.parkingAvailable} of ${facility.totalSpaces} truck spaces free right now for your whole stay.`
                    : `${selectedAv.walkInAvailable} entry-only places free right now. No parking reserved.`}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={type.tiny}>Total</Text>
          <Text style={styles.total}>{formatEUR(priceFor(bundle, hours))}</Text>
        </View>
        <Button title="Book right now" icon="lightning-bolt" onPress={goToCheckout} disabled={blocked || !!blocking} style={{ flex: 1.4 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal },
  availRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  smallBox: {
    width: 130,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    justifyContent: "center",
    gap: 2,
  },
  smallBoxNum: { fontSize: 22, fontWeight: "800", color: colors.navy },
  amenityGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  amenity: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  amenityIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.navyLight, alignItems: "center", justifyContent: "center" },
  amenityText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text },
  bundle: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 2, borderColor: "transparent" },
  bundleSelected: { borderColor: colors.navy },
  bundleHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  bundleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.navyLight, alignItems: "center", justifyContent: "center" },
  bundleTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  bundlePrice: { fontSize: 15, fontWeight: "800", color: colors.tealDark, marginTop: 2 },
  feature: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, marginLeft: 4 },
  warn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  warnText: { fontSize: 13, fontWeight: "700", color: colors.danger, flex: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  total: { fontSize: 24, fontWeight: "900", color: colors.navy },
});
