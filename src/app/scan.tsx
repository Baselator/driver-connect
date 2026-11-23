import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScanResultModal } from "@/components/ScanResultModal";
import { Button, EmptyState, Icon } from "@/components/ui";
import { colors, radius, spacing, type } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import type { ScanResult } from "@/models/types";

/**
 * Simulated entrance gate. Point the camera at a DriverConnect booking QR code
 * (e.g. shown on a second phone or a screenshot on a laptop).
 */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { scanEntry } = useApp();
  const [result, setResult] = useState<ScanResult | null>(null);
  const locked = useRef(false);

  if (!permission) return <View style={styles.safe} />;

  if (!permission.granted) {
    return (
      <View style={styles.safe}>
        <EmptyState
          icon="camera-outline"
          title="Camera access needed"
          message="The entrance scanner uses the camera to read booking QR codes."
          action={<Button title="Allow camera" icon="camera" onPress={requestPermission} />}
        />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.navyDark }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={async ({ data }) => {
          if (locked.current) return; // ignore repeated frames while a result is shown
          locked.current = true;
          setResult(await scanEntry(data));
        }}
      />
      <View style={styles.frameWrap}>
        <View style={styles.frame} />
      </View>
      <View style={styles.panel}>
        <Icon name="qrcode-scan" color={colors.white} size={28} />
        <Text style={[type.h3, { color: colors.white, marginTop: 6 }]}>Scan booking QR code</Text>
        <Text style={[type.small, { color: "#C9D6DF", textAlign: "center" }]}>
          Demo gate · validated locally on this device. Each code opens the gate only once.
        </Text>
      </View>
      <ScanResultModal
        result={result}
        onClose={() => {
          setResult(null);
          setTimeout(() => (locked.current = false), 800);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite, justifyContent: "center" },
  frameWrap: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  frame: { width: 240, height: 240, borderRadius: radius.xl, borderWidth: 4, borderColor: colors.orange },
  panel: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: "rgba(11,37,54,0.85)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
});
