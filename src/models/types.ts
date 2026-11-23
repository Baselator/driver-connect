// Shared TypeScript models. A real backend can return the same shapes later.

export type LatLng = { latitude: number; longitude: number };

export type ExtraAmenity = "ev" | "laundry" | "truckwash" | "staffed" | "cctv" | "wifi";

export interface Facility {
  id: string;
  name: string;
  city: string;
  motorway: string;
  locationNote: string;
  address: string;
  coordinate: LatLng;
  /** Total truck spaces. Always between 10 and 20. */
  totalSpaces: number;
  /** Demo: spaces free during the day (other drivers occupy the rest). */
  baseAvailable: number;
  /** Demo: extra spaces taken by other drivers at night (22:00–05:00). */
  nightExtraOccupied: number;
  /** Places inside the facility (showers, gym, lounge…). Always MORE than totalSpaces. */
  entryCapacity: number;
  /** Demo: "Facility Entry Only" visitors from other drivers. */
  baseWalkInVisitors: number;
  openingHours: string;
  rating: number;
  extras: ExtraAmenity[];
}

export type BundleType = "overnight" | "shortTerm" | "entryOnly";

export interface BundleDefinition {
  type: BundleType;
  title: string;
  shortTitle: string;
  icon: string;
  includesParking: boolean;
  features: string[];
  durationOptions: number[];
  defaultDuration: number;
}

export type BookingStatus = "confirmed" | "cancelled";
export type BookingPhase = "upcoming" | "active" | "completed" | "cancelled";
export type PaymentStatus = "paid" | "refunded" | "pending" | "failed";

export interface Booking {
  id: string;
  reservationId: string;
  facilityId: string;
  facilityName: string;
  bundle: BundleType;
  startAt: number; // ms timestamp
  endAt: number; // ms timestamp
  hours: number;
  createdAt: number;
  amount: number;
  currency: "EUR";
  paymentMethodId: string;
  paymentMethodLabel: string;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  qrToken: string;
  tokenUsedAt: number | null;
  /** Set when the driver left early ("Leave now"). endAt is then moved to this time. */
  checkedOutAt?: number | null;
  /** The originally booked end time (kept when the driver leaves early). */
  bookedEndAt?: number;
  /** Amount refunded (simulated) after cancelling or leaving early. */
  refundedAmount?: number;
  transactionId: string;
  vehiclePlate: string;
}

export type PaymentMethodType = "visa" | "mastercard" | "paypal";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  detail: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  createdAt: number;
  facilityId: string;
  facilityName: string;
  bundle: BundleType;
  description: string;
  amount: number; // negative = refund
  currency: "EUR";
  status: PaymentStatus;
  paymentMethodLabel: string;
  bookingId?: string;
  reservationId?: string;
}

export interface UserProfile {
  name: string;
  accountType: string;
  email: string;
  phone: string;
  company: string;
  truckPlate: string;
}

export interface AppSettings {
  language: "en" | "de";
  currency: "EUR";
  notifications: boolean;
}

export interface Availability {
  parkingAvailable: number;
  parkingTotal: number;
  /** Free places inside the facility (always ≥ free parking spaces). */
  entryAvailable: number;
  entryTotal: number;
  /** Free places for "Facility Entry Only" visitors (the extra places inside). */
  walkInAvailable: number;
}

export type AvailabilityLevel = "available" | "almostFull" | "full";

export type ScanCode =
  | "granted"
  | "already_used"
  | "not_found"
  | "cancelled"
  | "too_early"
  | "expired"
  | "invalid";

export interface ScanResult {
  ok: boolean;
  code: ScanCode;
  title: string;
  message: string;
  reservationId?: string;
  facilityName?: string;
}

export interface RouteResult {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  source: "google" | "estimate";
}

export interface PlaceResult {
  id: string;
  title: string;
  subtitle: string;
  coordinate?: LatLng;
  source: "google" | "local";
}
