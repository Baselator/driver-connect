import Constants from "expo-constants";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Logo } from "@/components/Logo";
import { Card, Icon } from "@/components/ui";
import { HAS_GOOGLE_KEY } from "@/config/appConfig";
import { colors, spacing, type } from "@/constants/theme";

const POINTS = [
  { icon: "truck", text: "Compact facilities with only 10–20 truck spaces – quiet, clean and affordable." },
  { icon: "calendar-check", text: "Reserve your space in advance instead of searching at night." },
  { icon: "shower-head", text: "Showers, a small gym, lounge, kitchen and healthy food at every stop." },
  { icon: "qrcode", text: "One-time QR code for contactless entry." },
];

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
      <View style={{ alignItems: "center", marginVertical: spacing.xl }}>
        <Logo size={96} />
        <Text style={[type.small, { marginTop: spacing.md }]}>Rest better. Drive safer.</Text>
      </View>
      <Card style={{ gap: spacing.md }}>
        {POINTS.map((p) => (
          <View key={p.icon} style={styles.point}>
            <Icon name={p.icon} color={colors.orange} />
            <Text style={[type.body, { flex: 1 }]}>{p.text}</Text>
          </View>
        ))}
      </Card>
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={type.small}>Version {Constants.expoConfig?.version ?? "1.0.0"} · MVP prototype</Text>
        <Text style={type.small}>Maps: {HAS_GOOGLE_KEY ? "Google Places & Routes enabled" : "offline demo mode (no API key)"}</Text>
        <Text style={[type.tiny, { marginTop: spacing.sm }]}>
          All facilities, the user, payments and availability are fictional demo data stored on this device. Routes are
          estimates and are not guaranteed to be truck-safe.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  point: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
});
