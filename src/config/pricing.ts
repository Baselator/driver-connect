import type { BundleDefinition, BundleType } from "@/models/types";

/**
 * Fictional prices in euros. Edit these numbers to change prices everywhere.
 * Healthy food & drinks are NOT included – they are bought separately at the vending machines.
 */
export const PRICING = {
  currency: "EUR" as const,
  overnight: { flat: 24.9 }, // parking up to 12 h + facility entry
  shortTerm: { entryFee: 4.9, perHour: 3.5 }, // 1–4 h parking + facility entry
  entryOnly: { flat: 7.9 }, // 3 h facility access, no parking
};

export const BUNDLES: Record<BundleType, BundleDefinition> = {
  overnight: {
    type: "overnight",
    title: "Overnight Parking + Facility Entry",
    shortTitle: "Overnight",
    icon: "weather-night",
    includesParking: true,
    features: [
      "Reserved overnight truck space",
      "Showers, toilets, gym, lounge & kitchen",
      "Stay up to 12 hours",
    ],
    durationOptions: [8, 10, 12],
    defaultDuration: 10,
  },
  shortTerm: {
    type: "shortTerm",
    title: "Short-Term Parking + Facility Entry",
    shortTitle: "Short-term",
    icon: "timer-outline",
    includesParking: true,
    features: [
      "Reserved truck space for 1–4 hours",
      "Showers, toilets, gym, lounge & kitchen",
      "Perfect for your 45-minute break",
    ],
    durationOptions: [1, 2, 3, 4],
    defaultDuration: 2,
  },
  entryOnly: {
    type: "entryOnly",
    title: "Facility Entry Only",
    shortTitle: "Entry only",
    icon: "door-open",
    includesParking: false,
    features: [
      "Showers, toilets, gym, lounge & kitchen",
      "3 hours of access",
      "No parking reservation",
    ],
    durationOptions: [3],
    defaultDuration: 3,
  },
};

export const BUNDLE_ORDER: BundleType[] = ["overnight", "shortTerm", "entryOnly"];

/**
 * Refund rules when a driver ENDS a booking early (simulated):
 *  - before entering (QR code not used): full refund;
 *  - after entering: unused FULL hours of short-term parking are refunded;
 *    overnight and entry-only are flat prices, so there is no refund once you are inside.
 */
export function refundForEarlyExit(bundle: BundleType, unusedMs: number): number {
  if (bundle !== "shortTerm") return 0;
  const unusedHours = Math.floor(unusedMs / 3600_000);
  return round2(Math.max(0, unusedHours) * PRICING.shortTerm.perHour);
}

export function priceFor(bundle: BundleType, hours: number): number {
  switch (bundle) {
    case "overnight":
      return PRICING.overnight.flat;
    case "shortTerm":
      return round2(PRICING.shortTerm.entryFee + PRICING.shortTerm.perHour * hours);
    case "entryOnly":
      return PRICING.entryOnly.flat;
  }
}

/** Line items shown in the booking summary and receipt. */
export function priceBreakdown(bundle: BundleType, hours: number): { label: string; amount: number }[] {
  switch (bundle) {
    case "overnight":
      return [{ label: "Overnight parking + facility entry", amount: PRICING.overnight.flat }];
    case "shortTerm":
      return [
        { label: "Facility entry", amount: PRICING.shortTerm.entryFee },
        { label: `Parking ${hours} h × ${PRICING.shortTerm.perHour.toFixed(2)} €`, amount: round2(PRICING.shortTerm.perHour * hours) },
      ];
    case "entryOnly":
      return [{ label: "Facility entry (3 h)", amount: PRICING.entryOnly.flat }];
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
