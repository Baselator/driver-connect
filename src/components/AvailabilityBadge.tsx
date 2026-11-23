import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/constants/theme";
import { availabilityLevel, LEVEL_LABEL } from "@/services/availabilityService";
import type { AvailabilityLevel } from "@/models/types";

export const LEVEL_COLORS: Record<AvailabilityLevel, { fg: string; bg: string; dot: string }> = {
  available: { fg: colors.tealDark, bg: colors.tealLight, dot: colors.teal },
  almostFull: { fg: colors.orangeDark, bg: colors.orangeLight, dot: colors.orange },
  full: { fg: "#6B747C", bg: colors.grayLight, dot: colors.gray },
};

/** "7 / 15 spaces available · Available" in teal / orange / gray. */
export function AvailabilityBadge({
  available,
  total,
  size = "md",
}: {
  available: number;
  total: number;
  size?: "sm" | "md" | "lg";
}) {
  const level = availabilityLevel(available);
  const c = LEVEL_COLORS[level];

  if (size === "lg") {
    return (
      <View style={[styles.lg, { backgroundColor: c.bg }]}>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={[styles.lgNumber, { color: c.fg }]}>{available}</Text>
          <Text style={[styles.lgTotal, { color: c.fg }]}> / {total}</Text>
        </View>
        <Text style={[styles.lgCaption, { color: c.fg }]}>truck spaces available</Text>
        <View style={[styles.levelTag, { backgroundColor: c.dot }]}>
          <Text style={styles.levelTagText}>{LEVEL_LABEL[level]}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, size === "sm" && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.text, { color: c.fg }, size === "sm" && { fontSize: 12 }]}>
        <Text style={{ fontWeight: "800" }}>
          {available} / {total}
        </Text>
        {size === "sm" ? " free" : " spaces available"}
      </Text>
      {size === "md" ? <Text style={[styles.level, { color: c.fg }]}>· {LEVEL_LABEL[level]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  text: { fontSize: 14, fontWeight: "600" },
  level: { fontSize: 14, fontWeight: "600" },
  lg: { borderRadius: radius.lg, padding: 16, alignItems: "flex-start", flex: 1 },
  lgNumber: { fontSize: 40, fontWeight: "900" },
  lgTotal: { fontSize: 22, fontWeight: "700" },
  lgCaption: { fontSize: 14, fontWeight: "600", marginTop: -2 },
  levelTag: { marginTop: 10, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  levelTagText: { color: colors.white, fontWeight: "800", fontSize: 13 },
});
