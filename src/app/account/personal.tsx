import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Card } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import type { UserProfile } from "@/models/types";

const FIELDS: { key: keyof UserProfile; label: string; keyboard?: "email-address" | "phone-pad" }[] = [
  { key: "name", label: "Full name" },
  { key: "accountType", label: "Account type" },
  { key: "email", label: "Email", keyboard: "email-address" },
  { key: "phone", label: "Phone", keyboard: "phone-pad" },
  { key: "company", label: "Company" },
  { key: "truckPlate", label: "Truck licence plate" },
];

export default function PersonalInfoScreen() {
  const { profile, updateProfile } = useApp();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [saving, setSaving] = useState(false);
  const changed = FIELDS.some((f) => draft[f.key] !== profile[f.key]);

  const save = async () => {
    setSaving(true);
    await updateProfile(draft);
    setSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: spacing.md }}>
          {FIELDS.map((f) => (
            <View key={f.key}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                value={draft[f.key]}
                onChangeText={(v) => setDraft({ ...draft, [f.key]: v })}
                keyboardType={f.keyboard ?? "default"}
                autoCapitalize={f.keyboard === "email-address" ? "none" : "words"}
                style={styles.input}
              />
            </View>
          ))}
        </Card>
        <Text style={styles.note}>Demo profile – saved only on this device.</Text>
        <Button title="Save changes" icon="content-save-outline" onPress={save} loading={saving} disabled={!changed} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 6 },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.offWhite,
  },
  note: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md, textAlign: "center" },
});
