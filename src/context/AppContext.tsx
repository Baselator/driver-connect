import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCATION } from "@/config/appConfig";
import type {
  AppSettings,
  Booking,
  Facility,
  LatLng,
  PaymentMethod,
  ScanResult,
  Transaction,
  UserProfile,
} from "@/models/types";
import { validateEntryScan } from "@/services/accessService";
import * as bookingService from "@/services/bookingService";
import { ensureSeeded, resetDemoData } from "@/services/demoDataService";
import { fetchFacilities, getFacilitiesSync } from "@/services/facilityService";
import { getCurrentLocation } from "@/services/locationService";
import * as profileService from "@/services/profileService";
import { listTransactions } from "@/services/transactionService";
import { DEMO_PROFILE, DEMO_SETTINGS } from "@/data/demoSeed";

/**
 * Central app state. Screens read data from here and call the actions below.
 * All actions go through the services in /src/services (local storage today, a backend tomorrow).
 */
interface AppState {
  ready: boolean;
  facilities: Facility[];
  profile: UserProfile;
  settings: AppSettings;
  paymentMethods: PaymentMethod[];
  bookings: Booking[];
  transactions: Transaction[];
  userLocation: LatLng;
  locationSource: "gps" | "default" | "pending";
  refreshLocation: () => Promise<LatLng>;
  createBooking: (input: Omit<bookingService.CreateBookingInput, "vehiclePlate">) => Promise<bookingService.CreateBookingResult>;
  /** Cancel (before entering) or leave early (after entering). Frees the space immediately. */
  endBooking: (id: string) => ReturnType<typeof bookingService.endBooking>;
  scanEntry: (qrData: string, scanTime?: number) => Promise<ScanResult>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  resetDemo: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>(getFacilitiesSync());
  const [profile, setProfile] = useState<UserProfile>(DEMO_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(DEMO_SETTINGS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng>(DEFAULT_LOCATION);
  const [locationSource, setLocationSource] = useState<"gps" | "default" | "pending">("pending");

  const reload = useCallback(async () => {
    const [f, p, s, pm, b, t] = await Promise.all([
      fetchFacilities(),
      profileService.getProfile(),
      profileService.getSettings(),
      profileService.getPaymentMethods(),
      bookingService.listBookings(),
      listTransactions(),
    ]);
    setFacilities(f);
    setProfile(p);
    setSettings(s);
    setPaymentMethods(pm);
    setBookings(b);
    setTransactions(t);
  }, []);

  useEffect(() => {
    (async () => {
      await ensureSeeded();
      await reload();
      setReady(true);
    })();
  }, [reload]);

  const refreshLocation = useCallback(async () => {
    const fix = await getCurrentLocation();
    setUserLocation(fix.coordinate);
    setLocationSource(fix.source);
    return fix.coordinate;
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      facilities,
      profile,
      settings,
      paymentMethods,
      bookings,
      transactions,
      userLocation,
      locationSource,
      refreshLocation,
      createBooking: async (input) => {
        const res = await bookingService.createBooking({ ...input, vehiclePlate: profile.truckPlate });
        await reload();
        return res;
      },
      endBooking: async (id) => {
        const res = await bookingService.endBooking(id);
        await reload();
        return res;
      },
      scanEntry: async (qrData, scanTime) => {
        const res = await validateEntryScan(qrData, scanTime);
        await reload();
        return res;
      },
      updateProfile: async (patch) => {
        setProfile(await profileService.updateProfile(patch));
      },
      updateSettings: async (patch) => {
        setSettings(await profileService.updateSettings(patch));
      },
      setDefaultPaymentMethod: async (id) => {
        setPaymentMethods(await profileService.setDefaultPaymentMethod(id));
      },
      resetDemo: async () => {
        await resetDemoData();
        await reload();
      },
    }),
    [ready, facilities, profile, settings, paymentMethods, bookings, transactions, userLocation, locationSource, refreshLocation, reload],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
