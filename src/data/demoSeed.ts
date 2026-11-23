import type { AppSettings, Booking, PaymentMethod, Transaction, UserProfile } from "@/models/types";

/** The fictional demo user. Edit these values to change the starting profile. */
export const DEMO_PROFILE: UserProfile = {
  name: "Alex Müller",
  accountType: "Truck Driver",
  email: "alex.mueller@example.com",
  phone: "+49 151 2345 6789",
  company: "Müller Logistik GmbH",
  truckPlate: "MS-DC 4242",
};

export const DEMO_SETTINGS: AppSettings = {
  language: "en",
  currency: "EUR",
  notifications: true,
};

/** Demo payment methods – no real card details are ever collected. */
export const DEMO_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm-visa", type: "visa", label: "Visa •••• 4242", detail: "Expires 09/29", isDefault: true },
  { id: "pm-mc", type: "mastercard", label: "Mastercard •••• 5555", detail: "Expires 04/28", isDefault: false },
  { id: "pm-paypal", type: "paypal", label: "PayPal (demo)", detail: "alex.mueller@example.com", isDefault: false },
];

const HOUR = 3600_000;
const DAY = 24 * HOUR;

/** Example history, placed relative to "now" so it always looks recent. */
export function buildDemoHistory(now: number): { bookings: Booking[]; transactions: Transaction[] } {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const day = (n: number, hour: number) => startOfToday.getTime() - n * DAY + hour * HOUR;

  const completed: Booking = {
    id: "bk-demo-1",
    reservationId: "DC-7Q4K2M",
    facilityId: "osnabrueck",
    facilityName: "DriverConnect Tecklenburger Land",
    bundle: "shortTerm",
    startAt: day(3, 13),
    endAt: day(3, 15),
    hours: 2,
    createdAt: day(3, 11),
    amount: 11.9,
    currency: "EUR",
    paymentMethodId: "pm-mc",
    paymentMethodLabel: "Mastercard •••• 5555",
    paymentStatus: "paid",
    status: "confirmed",
    qrToken: "demo0000token0001",
    tokenUsedAt: day(3, 13) + 10 * 60_000,
    transactionId: "tx-demo-3",
    vehiclePlate: DEMO_PROFILE.truckPlate,
  };

  const transactions: Transaction[] = [
    {
      id: "tx-demo-1",
      createdAt: day(9, 19),
      facilityId: "hannover",
      facilityName: "DriverConnect Garbsen",
      bundle: "overnight",
      description: "Overnight Parking + Facility Entry",
      amount: 24.9,
      currency: "EUR",
      status: "paid",
      paymentMethodLabel: "Visa •••• 4242",
      reservationId: "DC-3HX9PA",
    },
    {
      id: "tx-demo-2",
      createdAt: day(6, 8),
      facilityId: "kassel",
      facilityName: "DriverConnect Kassel",
      bundle: "entryOnly",
      description: "Facility Entry Only",
      amount: 7.9,
      currency: "EUR",
      status: "paid",
      paymentMethodLabel: "PayPal (demo)",
      reservationId: "DC-W2N8LE",
    },
    {
      id: "tx-demo-3",
      createdAt: completed.createdAt,
      facilityId: completed.facilityId,
      facilityName: completed.facilityName,
      bundle: completed.bundle,
      description: "Short-Term Parking + Facility Entry (2 h)",
      amount: completed.amount,
      currency: "EUR",
      status: "paid",
      paymentMethodLabel: completed.paymentMethodLabel,
      bookingId: completed.id,
      reservationId: completed.reservationId,
    },
  ];

  return { bookings: [completed], transactions };
}
