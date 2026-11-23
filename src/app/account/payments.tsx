import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PaymentIcon } from "@/components/PaymentIcon";
import { Card, Icon } from "@/components/ui";
import { colors, radius, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function PaymentMethodsScreen() {
  const { paymentMethods, setDefaultPaymentMethod } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[type.small, { marginBottom: spacing.md }]}>Tap a method to make it your default for new bookings.</Text>
      <View style={{ gap: spacing.md }}>
        {paymentMethods.map((m) => (
          <Pressable key={m.id} onPress={() => setDefaultPaymentMethod(m.id)} style={[styles.method, m.isDefault && styles.selected]}>
            <PaymentIcon type={m.type} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{m.label}</Text>
              <Text style={type.tiny}>{m.detail}</Text>
            </View>
            {m.isDefault ? (
              <View style={styles.defaultTag}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            ) : (
              <Icon name="radiobox-blank" color={colors.gray} size={26} />
            )}
          </Pressable>
        ))}
      </View>
      <Card style={{ marginTop: spacing.xl, flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
        <Icon name="shield-lock-outline" size={28} color={colors.navy} />
        <Text style={[type.small, { flex: 1 }]}>
          Demo only. DriverConnect does not collect or store real card details. A payment provider will handle this in the real app.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 76,
  },
  selected: { borderColor: colors.teal },
  label: { fontSize: 16, fontWeight: "700", color: colors.text },
  defaultTag: { backgroundColor: colors.teal, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  defaultText: { color: colors.white, fontWeight: "800", fontSize: 12 },
});
