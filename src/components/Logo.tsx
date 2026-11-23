import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/constants/theme";

/**
 * Official DriverConnect logo, redrawn as a vector so it stays sharp at every size.
 * Mark = location pin + two-lane winding road. Wordmark = "driver" (navy) / "connect" (teal).
 * The same artwork is in assets/brand/ (SVG) and was used to generate the app icon & splash.
 */

export const PIN_COLOR = "#F4B65E"; // pin colour taken from the logo artwork

// Pin with a hole (even-odd fill), so it works on any background.
const PIN =
  "M68 59 C 60 50, 47 39, 47 26 A 21 21 0 0 1 89 26 C 89 39, 76 50, 68 59 Z M58.5 25 a 9.5 9.5 0 1 0 19 0 a 9.5 9.5 0 1 0 -19 0 Z";
const TEAL_LANE =
  "M6 96 C 16 78, 44 68, 74 61 C 86 58, 92 55, 90 52 C 89 50, 86 49.5, 80 49.5 C 88 49, 96 50, 96 54 C 96 58, 88 61, 78 64 C 54 71, 36 80, 28 96 Z";
const NAVY_LANE =
  "M40 96 C 48 80, 70 70, 90 63 C 100 59, 103 54, 100 50 C 98 47, 92 46, 82 46.5 C 94 44, 106 46, 106 53 C 106 62, 94 69, 80 76 C 70 81, 63 88, 61 96 Z";

/** The icon only (pin + road). `size` = height in px. */
export function LogoMark({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    // viewBox has a small margin on every side so the pin top and road ends are never cut off.
    <Svg width={(size * 110) / 98} height={size} viewBox="-2 0 110 98" style={{ overflow: "visible" }}>
      <Path d={PIN} fill={PIN_COLOR} fillRule="evenodd" />
      <Path d={TEAL_LANE} fill={colors.teal} />
      <Path d={NAVY_LANE} fill={light ? colors.white : colors.navy} />
    </Svg>
  );
}

/** "driver / connect" in the brand font (Poppins SemiBold, loaded in app/_layout.tsx). */
export function Wordmark({ size = 36, light = false }: { size?: number; light?: boolean }) {
  const fontSize = size * 0.5;
  // No fixed lineHeight: a lineHeight smaller than the font's own height clips the
  // tops of letters on iOS/Android. Each line keeps its full natural box (so nothing is
  // cut) and the second line is pulled up with a negative margin to stack them tightly.
  const text = {
    fontFamily: "Poppins_600SemiBold",
    fontSize,
    letterSpacing: -fontSize * 0.02,
    includeFontPadding: false,
  } as const;
  return (
    <View style={{ justifyContent: "center", overflow: "visible" }}>
      <Text numberOfLines={1} style={[text, { color: light ? colors.white : colors.navy }]}>
        driver
      </Text>
      <Text numberOfLines={1} style={[text, { color: colors.teal, marginTop: -fontSize * 0.42 }]}>
        connect
      </Text>
    </View>
  );
}

/** Full logo: mark + wordmark side by side. `size` = height in px. */
export function Logo({ size = 36, light = false, style }: { size?: number; light?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: size * 0.12 }, style]}>
      <LogoMark size={size} light={light} />
      <Wordmark size={size} light={light} />
    </View>
  );
}
