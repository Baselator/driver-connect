import { Modal, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "@/constants/theme";
import type { ScanResult } from "@/models/types";
import { Button, Icon } from "./ui";

/** Big green / red result shown after an entrance scan. */
export function ScanResultModal({ result, onClose }: { result: ScanResult | null; onClose: () => void }) {
  const ok = result?.ok;
  return (
    <Modal visible={!!result} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={[styles.circle, { backgroundColor: ok ? colors.teal : colors.danger }]}>
            <Icon name={ok ? "lock-open-variant" : "close-thick"} size={46} color={colors.white} />
          </View>
          <Text style={[type.h2, { marginTop: spacing.lg, color: ok ? colors.tealDark : colors.danger }]}>{result?.title}</Text>
          <Text style={[type.body, { textAlign: "center", marginTop: spacing.sm }]}>{result?.message}</Text>
          {result?.facilityName ? <Text style={[type.small, { marginTop: spacing.sm }]}>{result.facilityName}</Text> : null}
          {ok ? <Text style={[type.tiny, { marginTop: spacing.sm, textAlign: "center" }]}>The QR code is now used. Your parking stays valid until departure.</Text> : null}
          <Button title="Done" onPress={onClose} style={{ marginTop: spacing.xl, alignSelf: "stretch" }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(17,53,78,0.55)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  box: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, alignItems: "center", width: "100%", maxWidth: 380 },
  circle: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center" },
});
