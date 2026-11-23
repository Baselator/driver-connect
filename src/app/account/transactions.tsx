import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { PAYMENT_STYLE } from "@/components/BookingCard";
import { Card, EmptyState, Icon, Pill } from "@/components/ui";
import { BUNDLES } from "@/config/pricing";
import { colors, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { formatDateTime, formatEUR } from "@/utils/format";

export default function TransactionsScreen() {
  const { transactions } = useApp();
  return (
    <FlatList
      data={transactions}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ padding: spacing.lg }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      renderItem={({ item: t }) => {
        const ps = PAYMENT_STYLE[t.status];
        return (
          <Card onPress={() => router.push({ pathname: "/account/receipt/[id]", params: { id: t.id } })}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Icon name={BUNDLES[t.bundle].icon} color={colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {t.facilityName}
                </Text>
                <Text style={type.small} numberOfLines={1}>
                  {t.description}
                </Text>
                <Text style={type.tiny}>{formatDateTime(t.createdAt)} · {t.paymentMethodLabel}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={[styles.amount, t.status === "refunded" && t.amount > 0 && styles.struck, t.amount < 0 && { color: colors.tealDark }]}>
                  {formatEUR(t.amount)}
                </Text>
                <Pill label={ps.label} color={ps.color} bg={ps.bg} />
              </View>
            </View>
          </Card>
        );
      }}
      ListEmptyComponent={<EmptyState icon="receipt" title="No transactions" message="Your payments will appear here." />}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.navyLight, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  amount: { fontSize: 16, fontWeight: "800", color: colors.navy },
  struck: { textDecorationLine: "line-through", color: colors.textMuted },
});
