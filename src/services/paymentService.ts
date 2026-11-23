import type { PaymentMethod } from "@/models/types";
import { newId } from "@/utils/id";

/**
 * SIMULATED payments. Nothing is charged and no card data is collected.
 * Replace `charge` with a real provider (e.g. Stripe, Adyen) via your backend later.
 */
export interface ChargeResult {
  success: boolean;
  paymentId: string;
  message: string;
}

export async function charge(method: PaymentMethod, amount: number): Promise<ChargeResult> {
  await new Promise((r) => setTimeout(r, 1400)); // pretend to talk to a payment provider
  if (amount <= 0) return { success: false, paymentId: "", message: "Invalid amount" };
  return {
    success: true,
    paymentId: newId("pay"),
    message: `Simulated payment of €${amount.toFixed(2)} with ${method.label} approved.`,
  };
}

export async function refund(paymentLabel: string, amount: number): Promise<ChargeResult> {
  await new Promise((r) => setTimeout(r, 600));
  return { success: true, paymentId: newId("ref"), message: `Simulated refund of €${amount.toFixed(2)} to ${paymentLabel}.` };
}
