import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FacilityCard } from "@/components/FacilityCard";
import { Logo } from "@/components/Logo";
import DCMap from "@/components/map/DCMap";
import type { DCMapHandle, MapFacility } from "@/components/map/mapTypes";
import { PlaceSearchModal, type PickedPlace } from "@/components/PlaceSearchModal";
import { Card, Icon } from "@/components/ui";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { DEFAULT_LOCATION_NAME, ROUTE_CORRIDOR_KM } from "@/config/appConfig";
import { colors, radius, shadow, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useNow } from "@/hooks/useNow";
import type { RouteResult } from "@/models/types";
import { getCurrentAvailability } from "@/services/availabilityService";
import { computeRoute, facilitiesAlongRoute } from "@/services/routeService";
import { formatDistance, formatDuration } from "@/utils/format";
import { haversineKm } from "@/utils/geo";

export default function MapScreen() {
  const { facilities, bookings, userLocation, locationSource, refreshLocation } = useApp();
  const mapRef = useRef<DCMapHandle>(null);
  const now = useNow(10_000); // live availability, refreshed every 10 s

  const [start, setStart] = useState<PickedPlace | null>(null); // null = current location
  const [destination, setDestination] = useState<PickedPlace | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routing, setRouting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picker, setPicker] = useState<"start" | "destination" | null>(null);

  // Ask for GPS once, then center the map on the driver.
  useEffect(() => {
    refreshLocation().then((c) => mapRef.current?.centerOn(c, 2.5));
  }, [refreshLocation]);

  const origin = start?.coordinate ?? userLocation;
  const routeRequest = useRef(0);

  // Calculates the route (called whenever start or destination change).
  const planRoute = async (from: PickedPlace | null, to: PickedPlace | null) => {
    const id = ++routeRequest.current;
    if (!to) {
      setRoute(null);
      setRouting(false);
      return;
    }
    setRouting(true);
    const r = await computeRoute(from?.coordinate ?? userLocation, to.coordinate);
    if (id !== routeRequest.current) return; // a newer request replaced this one
    setRoute(r);
    setRouting(false);
    mapRef.current?.fitTo(r.coordinates);
  };

  const changeStart = (p: PickedPlace | null) => {
    setStart(p);
    planRoute(p, destination);
  };

  const availability = useMemo(
    () => Object.fromEntries(facilities.map((f) => [f.id, getCurrentAvailability(f, bookings, now)])),
    [facilities, bookings, now],
  );

  const mapFacilities: MapFacility[] = facilities.map((f) => ({
    id: f.id,
    name: f.name,
    coordinate: f.coordinate,
    available: availability[f.id].parkingAvailable,
    total: f.totalSpaces,
  }));

  const onRoute = useMemo(() => (route ? facilitiesAlongRoute(route.coordinates, facilities) : []), [route, facilities]);
  const selected = facilities.find((f) => f.id === selectedId);

  const recenter = async () => {
    const c = await refreshLocation();
    mapRef.current?.centerOn(c, 0.6);
  };

  const clearRoute = () => {
    setDestination(null);
    setStart(null);
    planRoute(null, null);
  };

  const openFacility = (id: string) => router.push({ pathname: "/facility/[id]", params: { id } });

  return (
    <View style={styles.container}>
      <DCMap
        ref={mapRef}
        initialCenter={userLocation}
        start={start ? start.coordinate : destination ? userLocation : null}
        destination={destination?.coordinate}
        route={route?.coordinates}
        facilities={mapFacilities}
        highlightedIds={route ? onRoute.map((x) => x.facility.id) : undefined}
        selectedId={selectedId}
        onFacilityPress={(id) => setSelectedId(id)}
        onMapPress={() => setSelectedId(null)}
        onMapLongPress={(c) => changeStart({ title: `Pinned point (${c.latitude.toFixed(3)}, ${c.longitude.toFixed(3)})`, coordinate: c })}
      />

      {/* Top: logo + route planner */}
      <SafeAreaView edges={["top"]} style={[styles.topArea, { pointerEvents: "box-none" }]}>
        <Card style={styles.planner}>
          <View style={styles.plannerHeader}>
            <Logo size={34} />
            {destination ? (
              <Pressable onPress={clearRoute} hitSlop={10} style={styles.clearBtn}>
                <Icon name="close" size={18} color={colors.navy} />
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable style={styles.field} onPress={() => setPicker("start")}>
            <View style={[styles.dot, { backgroundColor: colors.teal }]} />
            <Text style={styles.fieldText} numberOfLines={1}>
              {start ? start.title : locationSource === "default" ? `${DEFAULT_LOCATION_NAME} (GPS unavailable)` : "Current location"}
            </Text>
            <Icon name="pencil-outline" size={18} color={colors.gray} />
          </Pressable>
          <View style={styles.fieldDivider} />
          <Pressable style={styles.field} onPress={() => setPicker("destination")}>
            <View style={[styles.dot, { backgroundColor: colors.navy, borderRadius: 3 }]} />
            <Text style={[styles.fieldText, !destination && { color: colors.gray }]} numberOfLines={1}>
              {destination ? destination.title : "Search destination"}
            </Text>
            <Icon name="magnify" size={20} color={colors.navy} />
          </Pressable>

          {routing ? (
            <View style={styles.routeInfo}>
              <ActivityIndicator color={colors.navy} />
              <Text style={type.small}>Calculating route…</Text>
            </View>
          ) : route ? (
            <View style={styles.routeInfo}>
              <Icon name="map-marker-path" size={20} color={colors.navy} />
              <Text style={styles.routeText}>
                {formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}
              </Text>
              <View style={styles.sourceTag}>
                <Text style={styles.sourceText}>{route.source === "google" ? "Google route" : "Estimate"}</Text>
              </View>
            </View>
          ) : null}
          {route ? (
            <Text style={styles.disclaimer}>Standard driving route – estimate only, not guaranteed truck-safe.</Text>
          ) : null}
        </Card>
      </SafeAreaView>

      {/* Recenter */}
      <Pressable style={[styles.recenter, { bottom: selected ? 240 : route ? 175 : 115 }]} onPress={recenter} accessibilityLabel="Recenter on my location">
        <Icon name="crosshairs-gps" size={26} color={colors.navy} />
      </Pressable>

      {/* Bottom panel */}
      <View style={[styles.bottom, { pointerEvents: "box-none" }]}>
        {selected ? (
          <View>
            <Pressable style={styles.closePreview} onPress={() => setSelectedId(null)} hitSlop={8}>
              <Icon name="close" size={18} color={colors.navy} />
            </Pressable>
            <FacilityCard
              facility={selected}
              available={availability[selected.id].parkingAvailable}
              distanceText={formatDistance(haversineKm(origin, selected.coordinate) * 1000) + " away"}
              onPress={() => openFacility(selected.id)}
            />
          </View>
        ) : route ? (
          <View>
            <Text style={styles.bottomTitle}>
              {onRoute.length} DriverConnect {onRoute.length === 1 ? "facility" : "facilities"} on your route
            </Text>
            {onRoute.length === 0 ? (
              <Card>
                <Text style={type.small}>No facilities within {ROUTE_CORRIDOR_KM} km of this route. Try another destination.</Text>
              </Card>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}>
                {onRoute.map(({ facility, detourKm, alongKm }) => (
                  <Card key={facility.id} style={styles.routeCard} onPress={() => openFacility(facility.id)}>
                    <Text style={styles.routeCardName} numberOfLines={1}>
                      {facility.name.replace("DriverConnect ", "")}
                    </Text>
                    <Text style={type.tiny}>
                      after {Math.round(alongKm)} km · {detourKm < 1 ? "on route" : `${Math.round(detourKm)} km off route`}
                    </Text>
                    <View style={{ marginTop: 8 }}>
                      <AvailabilityBadge available={availability[facility.id].parkingAvailable} total={facility.totalSpaces} size="sm" />
                    </View>
                  </Card>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <Card style={styles.hint}>
            <Icon name="truck-fast-outline" size={26} color={colors.orange} />
            <View style={{ flex: 1 }}>
              <Text style={styles.hintTitle}>{facilities.length} compact rest facilities</Text>
              <Text style={type.small}>Search a destination to find parking on your route, or tap a pin.</Text>
            </View>
          </Card>
        )}
      </View>

      <PlaceSearchModal
        visible={picker !== null}
        mode={picker ?? "destination"}
        near={origin}
        onClose={() => setPicker(null)}
        onUseCurrentLocation={() => {
          changeStart(null);
          setPicker(null);
        }}
        onPick={(p) => {
          if (picker === "start") changeStart(p);
          else {
            setDestination(p);
            planRoute(start, p);
          }
          setPicker(null);
          setSelectedId(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  topArea: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  planner: { padding: spacing.md, ...shadow.floating },
  plannerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 2, padding: 4 },
  clearText: { fontWeight: "700", color: colors.navy },
  field: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 46, paddingHorizontal: 4 },
  fieldDivider: { height: 1, backgroundColor: colors.border, marginLeft: 26 },
  fieldText: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  dot: { width: 12, height: 12, borderRadius: 6 },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  routeText: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.navy },
  sourceTag: { backgroundColor: colors.navyLight, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  sourceText: { fontSize: 12, fontWeight: "700", color: colors.navy },
  disclaimer: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  recenter: {
    position: "absolute",
    right: spacing.lg,
    bottom: 200,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.floating,
  },
  bottom: { position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md },
  bottomTitle: {
    alignSelf: "flex-start",
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
    backgroundColor: colors.navy,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  routeCard: { width: 220, padding: spacing.md },
  routeCardName: { fontSize: 15, fontWeight: "700", color: colors.text },
  hint: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  hintTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  closePreview: {
    position: "absolute",
    right: 8,
    top: -40,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
});
