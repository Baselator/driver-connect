import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookingCard } from "@/components/BookingCard";
import { Button, EmptyState, Icon, ScreenTitle } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useNow } from "@/hooks/useNow";
import type { BookingPhase } from "@/models/types";
import { bookingPhase } from "@/services/bookingService";

type Tab = Exclude<BookingPhase, "upcoming">;

const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function BookingsScreen() {
  const { bookings } = useApp();
  const now = useNow(15_000);
  const [tab, setTab] = useState<Tab>("active");

  const grouped = useMemo(() => {
    const g: Record<Tab, typeof bookings> = { active: [], completed: [], cancelled: [] };
    for (const b of bookings) {
      const phase = bookingPhase(b, now);
      g[phase === "upcoming" ? "active" : phase].push(b); // (older demo data may still contain future bookings)
    }
    g.active.sort((a, b) => a.endAt - b.endAt);
    g.completed.sort((a, b) => b.endAt - a.endAt);
    g.cancelled.sort((a, b) => b.createdAt - a.createdAt);
    return g;
  }, [bookings, now]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <ScreenTitle
          title="My Bookings"
          right={
            <Pressable style={styles.scanBtn} onPress={() => router.push("/scan")} accessibilityLabel="Open entrance scanner">
              <Icon name="qrcode-scan" color={colors.navy} />
            </Pressable>
          }
        />
        <View style={styles.segment}>
          {TABS.map((t) => {
            const sel = t.key === tab;
            const count = grouped[t.key].length;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.segBtn, sel && styles.segSel]}>
                <Text style={[styles.segText, sel && { color: colors.white }]} numberOfLines={1}>
                  {t.label}
                </Text>
                {count > 0 ? (
                  <View style={[styles.count, sel && { backgroundColor: colors.orange }]}>
                    <Text style={styles.countText}>{count}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      <FlatList
        data={grouped[tab]}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <BookingCard booking={item} now={now} onPress={() => router.push({ pathname: "/booking/[id]", params: { id: item.id } })} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="ticket-confirmation-outline"
            title={`No ${tab} bookings`}
            message={tab === "active" ? "Book a truck space right now at a facility near you." : "Nothing here yet."}
            action={tab === "active" ? <Button title="Find parking" icon="map-search-outline" onPress={() => router.navigate("/facilities")} /> : undefined}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  scanBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  segment: { flexDirection: "row", backgroundColor: colors.white, borderRadius: radius.md, padding: 4, gap: 4 },
  segBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 2,
  },
  segSel: { backgroundColor: colors.navy },
  segText: { fontSize: 13, fontWeight: "700", color: colors.navy, flexShrink: 1 },
  count: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.gray, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  countText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
