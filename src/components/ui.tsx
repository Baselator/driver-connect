import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  type ColorValue,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { colors, radius, shadow, spacing, type } from "@/constants/theme";
import { Logo } from "./Logo";

export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export function Icon({ name, size = 22, color = colors.navy }: { name: string; size?: number; color?: ColorValue }) {
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color as string} />;
}

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "teal" | "danger" | "ghost";

const BUTTON_COLORS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.navy, fg: colors.white, border: colors.navy },
  secondary: { bg: colors.white, fg: colors.navy, border: colors.navy },
  teal: { bg: colors.teal, fg: colors.white, border: colors.teal },
  danger: { bg: colors.white, fg: colors.danger, border: colors.danger },
  ghost: { bg: "transparent", fg: colors.navy, border: "transparent" },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const c = BUTTON_COLORS[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: c.bg, borderColor: c.border },
        isDisabled && styles.buttonDisabled,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 18 : 22} color={c.fg} /> : null}
          <Text style={[styles.buttonText, small && { fontSize: 15 }, { color: c.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/* ---------- Card ---------- */

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ---------- Chip ---------- */

export function Chip({
  label,
  selected,
  onPress,
  icon,
  disabled,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.chip, selected && styles.chipSelected, disabled && { opacity: 0.4 }, style]}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? colors.white : colors.navy} /> : null}
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Text helpers ---------- */

export function SectionTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.screenTitleRow}>
      <View style={{ flex: 1 }}>
        <Logo size={30} style={{ marginBottom: spacing.md }} />
        <Text style={type.h1}>{title}</Text>
        {subtitle ? <Text style={[type.small, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/* ---------- List row ---------- */

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      {icon ? (
        <View style={[styles.rowIcon, danger && { backgroundColor: colors.dangerLight }]}>
          <Icon name={icon} size={22} color={danger ? colors.danger : colors.navy} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={type.small}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" color={colors.gray} /> : null)}
    </Pressable>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />;
}

/* ---------- Status pill ---------- */

export function Pill({ label, color, bg, icon }: { label: string; color: string; bg: string; icon?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={14} color={color} /> : null}
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: string; title: string; message: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={36} color={colors.navy} />
      </View>
      <Text style={[type.h3, { textAlign: "center" }]}>{title}</Text>
      <Text style={[type.small, { textAlign: "center", marginTop: 4, marginBottom: spacing.lg }]}>{message}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonSmall: { minHeight: 42, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 17, fontWeight: "700" },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.navy },
  sectionTitle: { ...type.h3, marginTop: spacing.xl, marginBottom: spacing.md },
  screenTitleRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, minHeight: 60 },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 13, fontWeight: "700" },
  empty: { alignItems: "center", padding: spacing.xxl },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
});
