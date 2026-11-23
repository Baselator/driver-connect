import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/constants/theme";
import { useNow } from "@/hooks/useNow";
import type { Booking } from "@/models/types";
import { bookingPhase } from "@/services/bookingService";
import { formatCountdown, formatTime } from "@/utils/format";
import { Icon } from "./ui";

/** Parking timer – always calculated from the stored timestamps, so it survives app restarts. */
export function Countdown({ booking, large }: { booking: Booking; large?: boolean }) {
  const now = useNow(1000);
  const phase = bookingPhase(booking, now);
  if (phase === "cancelled" || phase === "completed") return null;

  const active = phase === "active";
  const target = active ? booking.endAt : booking.startAt;
  const label = active ? `Parking ends at ${formatTime(booking.endAt)}` : `Arrival at ${formatTime(booking.startAt)}`;
  const lowTime = active && booking.endAt - now < 30 * 60_000;
  const color = lowTime ? colors.orangeDark : active ? colors.tealDark : colors.navy;
  const bg = lowTime ? colors.orangeLight : active ? colors.tealLight : colors.navyLight;

  return (
    <View style={[styles.box, { backgroundColor: bg }, large && { padding: 16 }]}>
      <Icon name={active ? "timer-sand" : "clock-outline"} color={color} size={large ? 28 : 20} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color }]}>{active ? "Time left" : "Starts in"}</Text>
        <Text style={[styles.time, { color }, large && { fontSize: 26 }]}>{formatCountdown(target - now)}</Text>
        <Text style={[styles.sub, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.md },
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  time: { fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  sub: { fontSize: 13, fontWeight: "500" },
});
