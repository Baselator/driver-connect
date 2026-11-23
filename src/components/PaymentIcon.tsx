import { FontAwesome } from "@expo/vector-icons";
import type { PaymentMethodType } from "@/models/types";

const ICONS: Record<PaymentMethodType, { name: "cc-visa" | "cc-mastercard" | "cc-paypal"; color: string }> = {
  visa: { name: "cc-visa", color: "#1A1F71" },
  mastercard: { name: "cc-mastercard", color: "#EB001B" },
  paypal: { name: "cc-paypal", color: "#003087" },
};

export function PaymentIcon({ type, size = 30 }: { type: PaymentMethodType; size?: number }) {
  const ic = ICONS[type];
  return <FontAwesome name={ic.name} size={size} color={ic.color} />;
}
