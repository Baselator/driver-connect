import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Card, Chip, Divider, ListRow, SectionTitle } from "@/components/ui";
import { colors, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { confirmAction, notify } from "@/utils/confirm";

export default function SettingsScreen() {
  const { settings, updateSettings, resetDemo } = useApp();
  const [resetting, setResetting] = useState(false);

  const reset = () =>
    confirmAction(
      "Reset demo data?",
      "All bookings, transactions and profile changes on this device will be deleted and the original demo data restored.",
      "Reset",
      async () => {
        setResetting(true);
        await resetDemo();
        setResetting(false);
        notify("Demo data restored", "DriverConnect is back to its original demo state.");
        if (router.canDismiss()) router.dismissAll();
      },
    );

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}>
      <SectionTitle style={{ marginTop: 0 }}>Language</SectionTitle>
      <Card>
        <View style={styles.chips}>
          <Chip label="English" selected={settings.language === "en"} onPress={() => updateSettings({ language: "en" })} />
          <Chip label="Deutsch" selected={settings.language === "de"} onPress={() => updateSettings({ language: "de" })} />
        </View>
        {settings.language === "de" ? (
          <Text style={[type.tiny, { marginTop: spacing.sm }]}>Preference saved. German texts will be added in a later version.</Text>
        ) : null}
      </Card>

      <SectionTitle>Notifications</SectionTitle>
      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Booking reminders</Text>
            <Text style={type.small}>Arrival reminders and parking-time alerts</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(v) => updateSettings({ notifications: v })}
            trackColor={{ true: colors.teal, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>
      </Card>

      <SectionTitle>Currency</SectionTitle>
      <Card>
        <View style={styles.chips}>
          <Chip label="EUR (€)" selected />
        </View>
        <Text style={[type.tiny, { marginTop: spacing.sm }]}>All DriverConnect facilities are in the euro area.</Text>
      </Card>

      <SectionTitle>More</SectionTitle>
      <Card style={{ paddingVertical: spacing.sm }}>
        <ListRow icon="information-outline" title="About DriverConnect" onPress={() => router.push("/account/about")} />
        <Divider />
        <ListRow
          icon="restore"
          title={resetting ? "Resetting…" : "Reset demo data"}
          subtitle="Restore the original demo state"
          onPress={resetting ? undefined : reset}
          danger
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", gap: spacing.sm },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
});
