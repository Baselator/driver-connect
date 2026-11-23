import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Divider, ListRow, ScreenTitle } from "@/components/ui";
import { colors, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { formatEUR, initials } from "@/utils/format";

export default function ProfileScreen() {
  const { profile, paymentMethods, transactions, bookings } = useApp();
  const defaultMethod = paymentMethods.find((m) => m.isDefault);
  // paid bookings minus partial refunds (fully refunded bookings are not counted)
  const spent = transactions.filter((t) => t.status === "paid" || t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title="Profile" />
        <Card style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(profile.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>{profile.name}</Text>
            <Text style={styles.account}>{profile.accountType}</Text>
            <Text style={type.small}>{profile.email}</Text>
          </View>
        </Card>

        <View style={styles.stats}>
          <Card style={styles.stat}>
            <Text style={styles.statNum}>{bookings.length}</Text>
            <Text style={type.tiny}>bookings</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statNum}>{formatEUR(spent)}</Text>
            <Text style={type.tiny}>spent</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statNum}>EUR</Text>
            <Text style={type.tiny}>currency</Text>
          </Card>
        </View>

        <Card style={{ paddingVertical: spacing.sm, marginTop: spacing.lg }}>
          <ListRow icon="account-edit-outline" title="Personal information" subtitle={`${profile.phone} · ${profile.truckPlate}`} onPress={() => router.push("/account/personal")} />
          <Divider />
          <ListRow icon="credit-card-outline" title="Payment methods" subtitle={defaultMethod ? `Default: ${defaultMethod.label}` : "None"} onPress={() => router.push("/account/payments")} />
          <Divider />
          <ListRow icon="history" title="Transaction history" subtitle={`${transactions.length} transactions`} onPress={() => router.push("/account/transactions")} />
          <Divider />
          <ListRow icon="cog-outline" title="Settings" subtitle="Language, notifications, currency, reset demo" onPress={() => router.push("/account/settings")} />
        </Card>

        <Text style={[type.tiny, { textAlign: "center", marginTop: spacing.xl }]}>
          Demo account · data is stored only on this device
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: "800" },
  account: { fontSize: 14, fontWeight: "700", color: colors.tealDark, marginVertical: 2 },
  stats: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  stat: { flex: 1, alignItems: "center", padding: spacing.md },
  statNum: { fontSize: 18, fontWeight: "800", color: colors.navy },
});
