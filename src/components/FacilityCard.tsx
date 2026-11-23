import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "@/constants/theme";
import { CORE_AMENITIES } from "@/data/facilities";
import type { Facility } from "@/models/types";
import { formatEUR } from "@/utils/format";
import { PRICING } from "@/config/pricing";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { Card, Icon } from "./ui";

/** Facility preview used in the list, on the map and in "on your route". */
export function FacilityCard({
  facility,
  available,
  distanceText,
  onPress,
  compact,
}: {
  facility: Facility;
  available: number;
  distanceText?: string;
  onPress?: () => void;
  compact?: boolean;
}) {
  return (
    <Card onPress={onPress} style={compact ? { padding: spacing.md } : undefined}>
      <View style={styles.top}>
        <View style={styles.pin}>
          <Icon name="map-marker" color={colors.white} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {facility.name}
          </Text>
          <Text style={type.small} numberOfLines={1}>
            {facility.motorway} · {facility.locationNote}
          </Text>
        </View>
        {onPress ? <Icon name="chevron-right" color={colors.gray} /> : null}
      </View>
      <View style={styles.bottom}>
        <AvailabilityBadge available={available} total={facility.totalSpaces} size={compact ? "sm" : "md"} />
        {distanceText ? (
          <View style={styles.meta}>
            <Icon name="map-marker-distance" size={16} color={colors.textMuted} />
            <Text style={type.small}>{distanceText}</Text>
          </View>
        ) : null}
      </View>
      {!compact ? (
        <View style={styles.amenities}>
          {CORE_AMENITIES.map((a) => (
            <Icon key={a.key} name={a.icon} size={20} color={colors.navy} />
          ))}
          <View style={{ flex: 1 }} />
          <Text style={styles.from}>from {formatEUR(PRICING.entryOnly.flat)}</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md, gap: 8, flexWrap: "wrap" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  amenities: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  from: { fontSize: 14, fontWeight: "700", color: colors.navy },
});
