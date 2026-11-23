import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FacilityCard } from "@/components/FacilityCard";
import { Chip, EmptyState, Icon, ScreenTitle } from "@/components/ui";
import { colors, radius, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { EXTRA_AMENITIES } from "@/data/facilities";
import { useNow } from "@/hooks/useNow";
import type { ExtraAmenity } from "@/models/types";
import { getCurrentAvailability } from "@/services/availabilityService";
import { formatDistance } from "@/utils/format";
import { haversineKm } from "@/utils/geo";

type SortKey = "distance" | "spaces";
type AvailFilter = "all" | "available";

export default function FacilitiesScreen() {
  const { facilities, bookings, userLocation, locationSource } = useApp();
  const now = useNow(10_000); // live availability, refreshed every 10 s
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("distance");
  const [availFilter, setAvailFilter] = useState<AvailFilter>("all");
  const [extras, setExtras] = useState<ExtraAmenity[]>([]);

  const toggleExtra = (e: ExtraAmenity) => setExtras((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facilities
      .map((f) => ({
        facility: f,
        available: getCurrentAvailability(f, bookings, now).parkingAvailable,
        distanceKm: haversineKm(userLocation, f.coordinate),
      }))
      .filter(({ facility: f }) =>
        !q || [f.name, f.city, f.motorway, f.address].some((s) => s.toLowerCase().includes(q)),
      )
      .filter((x) => availFilter === "all" || x.available > 0)
      .filter((x) => extras.every((e) => x.facility.extras.includes(e)))
      .sort((a, b) => (sort === "distance" ? a.distanceKm - b.distanceKm : b.available - a.available || a.distanceKm - b.distanceKm));
  }, [facilities, bookings, now, query, sort, availFilter, extras, userLocation]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={(x) => x.facility.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <ScreenTitle
              title="Facilities"
              subtitle={`Compact rest stops · 10–20 truck spaces each${locationSource === "default" ? " · distances from Münster" : ""}`}
            />
            <View style={styles.search}>
              <Icon name="magnify" color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search city, motorway or name"
                placeholderTextColor={colors.gray}
                style={styles.input}
              />
              {query ? (
                <Pressable onPress={() => setQuery("")} hitSlop={10}>
                  <Icon name="close-circle" color={colors.gray} />
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.filterLabel}>Sort by</Text>
            <View style={styles.row}>
              <Chip label="Distance" icon="map-marker-distance" selected={sort === "distance"} onPress={() => setSort("distance")} />
              <Chip label="Available spaces" icon="truck" selected={sort === "spaces"} onPress={() => setSort("spaces")} />
            </View>

            <Text style={styles.filterLabel}>Filter</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              <Chip
                label="Parking available now"
                icon="check-circle-outline"
                selected={availFilter === "available"}
                onPress={() => setAvailFilter(availFilter === "all" ? "available" : "all")}
              />
              {(Object.keys(EXTRA_AMENITIES) as ExtraAmenity[]).map((key) => (
                <Chip
                  key={key}
                  label={EXTRA_AMENITIES[key].label}
                  icon={EXTRA_AMENITIES[key].icon}
                  selected={extras.includes(key)}
                  onPress={() => toggleExtra(key)}
                />
              ))}
            </ScrollView>
            <Text style={[type.small, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
              {items.length} {items.length === 1 ? "facility" : "facilities"} · all include showers, gym, lounge, kitchen & healthy food
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <FacilityCard
            facility={item.facility}
            available={item.available}
            distanceText={formatDistance(item.distanceKm * 1000)}
            onPress={() => router.push({ pathname: "/facility/[id]", params: { id: item.facility.id } })}
          />
        )}
        ListEmptyComponent={<EmptyState icon="map-search-outline" title="No facilities found" message="Try a different search or remove filters." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10 },
  filterLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, flexWrap: "nowrap" },
});
