import { StyleSheet, Text, View } from "react-native";
import { BUNDLES } from "@/config/pricing";
import { colors, radius, spacing, type } from "@/constants/theme";
import type { BundleType } from "@/models/types";
import { formatDateTime, formatTime } from "@/utils/format";
import { Chip, Icon } from "./ui";

/**
 * Bookings are for RIGHT NOW only (no future reservations):
 * the driver only picks how long to stay; arrival is always the current time.
 */
export function DurationSelector({
  bundle,
  startAt,
  hours,
  onChange,
}: {
  bundle: BundleType;
  startAt: number;
  hours: number;
  onChange: (hours: number) => void;
}) {
  const def = BUNDLES[bundle];
  const endAt = startAt + hours * 3600_000;

  return (
    <View>
      <View style={styles.now}>
        <View style={styles.nowIcon}>
          <Icon name="lightning-bolt" size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nowTitle}>Right now · {formatTime(startAt)}</Text>
          <Text style={styles.nowSub}>Your place is reserved from the moment you book.</Text>
        </View>
      </View>

      <Text style={styles.label}>{def.includesParking ? "How long do you want to park?" : "Access duration"}</Text>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        {def.durationOptions.map((h) => (
          <Chip key={h} label={`${h} h`} selected={h === hours} onPress={() => onChange(h)} />
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={type.small}>Arrive</Text>
        <Text style={styles.summaryValue}>Now · {formatDateTime(startAt)}</Text>
        <Text style={[type.small, { marginTop: 6 }]}>Depart</Text>
        <Text style={styles.summaryValue}>{formatDateTime(endAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  now: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.orangeLight,
    borderWidth: 2,
    borderColor: colors.orange,
  },
  nowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  nowTitle: { fontSize: 17, fontWeight: "800", color: colors.orangeDark },
  nowSub: { fontSize: 13, color: colors.navy },
  label: { fontSize: 14, fontWeight: "700", color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  summary: { marginTop: spacing.lg, padding: spacing.md, borderRadius: 12, backgroundColor: colors.offWhite },
  summaryValue: { fontSize: 16, fontWeight: "700", color: colors.text },
});
