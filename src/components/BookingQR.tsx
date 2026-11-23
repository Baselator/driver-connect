import QRCode from "react-native-qrcode-svg";
import { View } from "react-native";
import { colors } from "@/constants/theme";
import type { Booking } from "@/models/types";
import { encodeQr } from "@/services/accessService";

const QR_LOGO = require("@/assets/images/qr-logo.png");

export function BookingQR({ booking, size = 200 }: { booking: Booking; size?: number }) {
  const dim = booking.status === "cancelled" || booking.tokenUsedAt != null;
  const withLogo = size >= 140; // tiny QR previews stay plain so they remain scannable
  return (
    <View style={{ padding: 12, backgroundColor: colors.white, borderRadius: 16, opacity: dim ? 0.35 : 1 }}>
      <QRCode
        value={encodeQr(booking)}
        size={size}
        color={colors.navy}
        backgroundColor={colors.white}
        ecl={withLogo ? "H" : "M"}
        {...(withLogo && { logo: QR_LOGO, logoSize: size * 0.22, logoBackgroundColor: colors.white, logoBorderRadius: 8, logoMargin: 2 })}
      />
    </View>
  );
}
