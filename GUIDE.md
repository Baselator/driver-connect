# DriverConnect – Your Step-by-Step Guide

This guide explains how to **run**, **use** and **edit** the DriverConnect MVP in **Visual Studio Code** on Windows.

---

## 0. What you have

A working React Native + Expo (SDK 58) + TypeScript app for iOS and Android:

| Tab | What it does |
|---|---|
| **Map** | Map with your GPS position (Münster if GPS is off), start + destination search, route with distance & time, DriverConnect facilities near the route, availability pins, recenter button |
| **Facilities** | Search, filter (available now, Wi-Fi, EV charging, laundry…), sort by distance or free spaces |
| **My Bookings** | Active / Completed / Cancelled, QR codes, live parking countdown |
| **Profile** | Personal info (editable), payment methods, transaction history + receipts, settings, reset demo data |

Plus: facility details → 3 bundles → duration → live availability check → summary → simulated payment → booking + one-time QR code → entrance scan simulation.

**Booking rules**
- **Right now only:** every booking starts at the moment you pay. There are no future reservations.
- **One booking at a time:** while you have an active booking, you can't book another place. End the current one first. You can do that on the booking page, or straight from the warning on any facility page ("Leave & book here").
- **Ending a booking at any time:**
  - *Not entered yet* → **Cancel booking**: full refund.
  - *Already inside* → **Leave now (check out)**: the stay ends immediately and the space is freed. Unused full hours of short-term parking are refunded (€3.50/h); overnight and entry-only have flat prices, so there is no refund once you have entered. After leaving, the QR code no longer works.
  - The refund rule is in `src/config/pricing.ts` → `refundForEarlyExit`.
- **Live availability:** free spaces are recalculated every 10 seconds and right after every booking or cancellation.
- **More places inside than parking:** every facility has more places inside (showers, gym, lounge…) than truck spaces. Every parked driver has a place inside, and the extra places are for "Facility Entry Only" visitors.

Everything is **demo data stored on the phone** (AsyncStorage). There is no real database, login or payment yet.

---

## 1. One-time setup

1. **Node.js 22 or newer.** Already installed on this PC (Node 26 LTS). Check it in a terminal:
   ```bash
   node -v
   ```
2. **VS Code extensions.** Press `Ctrl+Shift+X` and install **Expo Tools**, **ESLint** and **Prettier**.
3. **Expo Go** on your phone (App Store / Google Play).

---

## 2. Open and run the app

1. In VS Code: **File → Open Folder…** → choose `driver-connect`.
2. Open the terminal: **Terminal → New Terminal** (or `` Ctrl+` ``).
3. The first time only (or after someone changes `package.json`):
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npx expo start
   ```
5. A QR code appears in the terminal:
   - **Android:** Expo Go → *Scan QR code*.
   - **iPhone:** open the normal Camera app → scan → tap the banner.

**Phone won't connect?** Make sure the phone and laptop are on the same Wi-Fi. University Wi-Fi (eduroam) often blocks this, so use a tunnel:
```bash
npx expo start --tunnel
```

**Useful keys** while the server runs: `r` = reload, `w` = open in the web browser, `j` = debugger, `Ctrl+C` = stop.

> **Web vs. phone:** pressing `w` opens a web preview with a simple drawn map of Germany (real maps only run on phones). Use it for quick checks; use your phone for the real experience.

---

## 3. How to use the app (demo walkthrough)

1. **Map tab:** allow location. Tap **Search destination**, type e.g. `Hamburg` and pick it. The route appears with distance and time, and the facilities on the route show at the bottom.
   - Change the start: tap the first line (or **long-press the map** to drop a start point).
   - Tap an orange pin to see a preview, then tap the card to open the facility.
   - The number on each pin is free spaces: **teal** = available, **orange** = almost full (≤ 3), **gray** = fully booked.
2. **Facility page:** choose a **bundle** and a **duration**. Arrival is always **right now**. The box under "3. Availability right now" shows if a space is free. If you already have an active booking, the page tells you and the Book button is disabled.
   - Try **Bremen**: it is fully booked, so parking bundles are blocked and the app offers *Facility Entry Only*.
3. Tap **Book right now** → check the summary → choose a payment method → **Pay** (simulated).
4. You land on your **booking**: QR code, reservation ID and a countdown.
5. **Test the QR entrance:**
   - *Simulate entrance scan* → **Access granted** (code is now used).
   - *Simulate entrance scan* again → **Code already used** (rejected).
   - *Open camera scanner* reads a real QR code. To test with two devices, show the QR on one phone and scan it with the other phone's scanner screen.
6. **My Bookings:** see your booking under Active. Open it and use **Cancel booking** (before entering) or **Leave now (check out)** (after entering) to end it early. It then moves to Completed ("Left early") or Cancelled, and you can book another place straight away.
7. **Profile:** edit personal info, change your default card, open **Transaction history → receipt**.
8. **Settings → Reset demo data** restores everything to the original state. Do this before a presentation.

---

## 4. Where everything lives

```
driver-connect/
├── app.config.js            App name, icons, permissions, Google Maps key plugin
├── .env                     Your Google API key (optional)
├── eas.json                 Cloud build profiles (EAS)
├── assets/images/           App icon, splash image (replace with your logo)
└── src/
    ├── app/                 ← SCREENS (every file = one screen / URL)
    │   ├── _layout.tsx          root navigation (screen titles)
    │   ├── (tabs)/_layout.tsx   bottom tab bar
    │   ├── (tabs)/index.tsx     Map
    │   ├── (tabs)/facilities.tsx
    │   ├── (tabs)/bookings.tsx
    │   ├── (tabs)/profile.tsx
    │   ├── facility/[id].tsx    facility details + bundle + time
    │   ├── checkout/[id].tsx    summary + payment
    │   ├── booking/[id].tsx     booking, QR, scan simulation
    │   ├── scan.tsx             camera entrance scanner
    │   └── account/…            personal info, payments, transactions, receipt, settings, about
    ├── components/          ← REUSABLE UI (buttons, cards, badges, QR, map, logo)
    │   ├── ui.tsx               Button, Card, Chip, ListRow, Pill…
    │   ├── map/DCMap.tsx        real map (phone)
    │   └── map/DCMap.web.tsx    drawn map (web preview)
    ├── constants/theme.ts   ← COLORS, spacing, font sizes
    ├── config/
    │   ├── pricing.ts       ← PRICES and bundle texts
    │   └── appConfig.ts     ← default location, route corridor, "almost full" limit…
    ├── data/
    │   ├── facilities.ts    ← THE 15 FACILITIES + amenity list
    │   ├── demoSeed.ts      ← demo user, cards, example transactions
    │   └── places.ts        offline city list for search
    ├── services/            ← LOGIC (swap for a real backend later)
    │   ├── availabilityService.ts  time-based free spaces
    │   ├── bookingService.ts       create / cancel bookings
    │   ├── paymentService.ts       simulated payments
    │   ├── accessService.ts        QR code + one-time validation
    │   ├── routeService.ts         Google Routes or estimate
    │   ├── placesService.ts        Google Places or offline search
    │   ├── locationService.ts      GPS (fallback Münster)
    │   ├── profileService.ts, transactionService.ts, facilityService.ts
    │   ├── demoDataService.ts      first-start seed + reset
    │   └── storage.ts              AsyncStorage helpers
    ├── context/AppContext.tsx  shared app state used by all screens
    └── models/types.ts         TypeScript data types
```

**Tip:** press `Ctrl+P` in VS Code and type a file name (e.g. `pricing`) to open it instantly. Press `Ctrl+Shift+F` to search all files for a text you see in the app.

---

## 5. Common edits (recipes)

After every change press **`Ctrl+S`**. The app on your phone updates automatically. If it doesn't, press `r` in the terminal.

### Change a text on a screen
1. Press `Ctrl+Shift+F` and search for the text, e.g. `compact rest facilities`.
2. Click the result, edit the text between the quotes or tags, and save.

### Change colors
Open `src/constants/theme.ts` and edit the hex codes, e.g. `navy: "#11354E"`. The whole app follows.

### The logo
The DriverConnect logo (pin + road + "driver / connect") is built in as a **vector**, so it is sharp at every size.

| Where | File |
|---|---|
| Logo in the app (map card, screen titles, headers, loading screen, About, receipts) | `src/components/Logo.tsx` (`Logo` = full logo, `LogoMark` = icon only) |
| Wordmark font (Poppins SemiBold) | loaded in `src/app/_layout.tsx` |
| Loading screen / splash (full logo) | `assets/images/splash-logo.png` (native splash) and `assets/images/logo-full.png` (in-app loading page, set up in `src/app/_layout.tsx`) |
| App icon, Android icon, browser icon | `assets/images/icon.png`, `android-icon-*.png`, `favicon.png` |
| Logo in the middle of booking QR codes | `assets/images/qr-logo.png` |
| Brand files for slides / print | `assets/brand/logo-mark.svg`, `assets/brand/logo-full.svg` |

Use it in any screen:
```tsx
import { Logo, LogoMark } from "@/components/Logo";
<Logo size={40} />        // full logo, 40 px high
<LogoMark size={32} />    // icon only
```
**Swapping in an official PNG later:** replace the image files above with the same names and sizes (icon 1024×1024, splash-logo about 1200 px wide with a transparent background), then restart with `npx expo start --clear`. A new app icon only appears in an installed build, not in Expo Go.

### Change prices
Open `src/config/pricing.ts`:
```ts
overnight: { flat: 24.9 },
shortTerm: { entryFee: 4.9, perHour: 3.5 },
entryOnly: { flat: 7.9 },
```
The bundle titles and bullet points are in the same file (`BUNDLES`).

### Edit or add a facility
Open `src/data/facilities.ts`. Copy one `{ … }` block, paste it, and change it:
- `id`: unique, lowercase, no spaces (e.g. `"berlin"`)
- `coordinate`: latitude/longitude. All 15 facilities sit at **real Autobahn rest areas** (Tank- und Rastanlagen) directly on the motorway, e.g. Münsterland (A1), Garbsen (A2), Königsforst (A3), Fürholzen (A9). To add one, find an existing rest area in Google Maps, right-click its car park and copy the coordinates. Put the rest area's name in `address` and the motorway in `motorway`.
- `totalSpaces`: **must be 10–20**. Anything outside is clamped automatically (rule in `services/facilityService.ts`).
- `entryCapacity`: places inside the facility. **Must be larger than `totalSpaces`** (at least +4; the demo uses +6). This is also enforced automatically.
- `baseWalkInVisitors`: demo "Facility Entry Only" visitors from other drivers.
- `baseAvailable`: free spaces during the day for the demo.
- `nightExtraOccupied`: extra spaces taken 22:00–05:00.
- The booking durations (8/10/12 h, 1–4 h, 3 h) are in `src/config/pricing.ts` → `durationOptions`.
- `extras`: any of `"wifi" "cctv" "ev" "laundry" "truckwash" "staffed"`.

### Change the demo user or cards
Open `src/data/demoSeed.ts`. The stored copy on the phone isn't replaced automatically, so afterwards go to **Profile → Settings → Reset demo data**.

### Change when a facility shows "Almost full"
`src/config/appConfig.ts` → `ALMOST_FULL_THRESHOLD = 3`.

### Add a new screen
1. Create a file, e.g. `src/app/help.tsx`:
   ```tsx
   import { Text, View } from "react-native";
   export default function Help() {
     return <View style={{ padding: 24 }}><Text>Help & support</Text></View>;
   }
   ```
2. Open it from anywhere with:
   ```tsx
   import { router } from "expo-router";
   router.push("/help");
   ```
3. Optional: give it a title in `src/app/_layout.tsx` with `<Stack.Screen name="help" options={{ title: "Help" }} />`.

### Add a new bottom tab
Create `src/app/(tabs)/news.tsx`, then add a `<Tabs.Screen name="news" … />` block in `src/app/(tabs)/_layout.tsx` (copy an existing one). Icon names: <https://icons.expo.fyi> (choose *MaterialCommunityIcons*).

### Check your code for mistakes
```bash
npx tsc --noEmit
```
```bash
npx expo lint
```

---

## 6. Optional: real Google Places search & Google routes

Without a key the app uses an offline city list and estimated straight-line routes, which is fine for demos. For real address search and road routes:

1. Go to <https://console.cloud.google.com>, create a project and set up billing. Google gives a free monthly credit.
2. **APIs & Services → Library** → enable **Maps SDK for Android**, **Maps SDK for iOS**, **Places API (New)** and **Routes API**.
3. **Credentials → Create credentials → API key**. Under *API restrictions*, allow only those 4 APIs.
4. Open `.env` in the project and paste the key:
   ```
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your key...
   ```
5. Restart with a clean cache:
   ```bash
   npx expo start --clear
   ```

Notes:
- In **Expo Go on iPhone**, the map uses Apple Maps (Expo Go has no Google Maps on iOS). Search and routes still use Google. Android always uses Google Maps.
- A key inside an app can be extracted, so keep the API restrictions on. In production, call Places/Routes through your own backend.
- `.env` holds your key, so don't share or upload it.

---

## 7. Building an installable app (later)

Expo Go is enough for development and demos. For a real app file (APK for Android, TestFlight for iOS) use **EAS Build**. Profiles are already in `eas.json`.

1. Create a free account at <https://expo.dev>.
2. Log in:
   ```bash
   npx eas-cli@latest login
   ```
3. Android test APK (installable on any Android phone):
   ```bash
   npx eas-cli@latest build --profile preview --platform android
   ```
4. iOS needs an Apple Developer account ($99/year):
   ```bash
   npx eas-cli@latest build --profile preview --platform ios
   ```
5. For a **development build** (needed for Google Maps on iPhone), first run:
   ```bash
   npx expo install expo-dev-client
   ```
   then:
   ```bash
   npx eas-cli@latest build --profile development --platform android
   ```

If you set a Google key, add it in the Expo website under **Project → Environment variables** as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` so cloud builds get it too.

---

## 8. Connecting a real backend later

Screens never talk to storage directly. They go through `src/context/AppContext.tsx` → `src/services/*`. To add a real database (e.g. Supabase or Firebase):

| Replace | With |
|---|---|
| `facilityService.fetchFacilities` | API call returning `Facility[]` |
| `availabilityService.getAvailability` | server availability check (with locking) |
| `bookingService.createBooking / cancelBooking` | server endpoints |
| `paymentService.charge / refund` | Stripe / Adyen via your server |
| `accessService.validateEntryScan` | **server-side** validation of signed one-time tokens |
| `profileService`, `transactionService` | user tables after adding login |

The data shapes are in `src/models/types.ts`. Keep them the same and the screens don't need to change.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `URL.parse is not a function` or "Node.js is outdated" | Install Node 22+ from <https://nodejs.org> and restart VS Code |
| `npx` "running scripts is disabled" in PowerShell | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or switch the terminal to *Command Prompt* |
| Phone can't connect | Same Wi-Fi, or `npx expo start --tunnel` |
| Changes don't show | Press `r`; if still stuck, `npx expo start --clear` |
| Red error screen | Read the first lines and the file name shown; undo your last edit (`Ctrl+Z`) and save |
| "GPS unavailable" | Allow location for Expo Go in phone settings; the app falls back to Münster |
| Map is blank on Android | Restart Expo Go; check internet connection |
| Strange old data | Profile → Settings → **Reset demo data** |

---

## 10. Known limits of this MVP

- All data stays on one device. Two phones don't share bookings. The camera scanner on a second phone still validates the QR itself and remembers used codes.
- Payments, availability of other drivers and the user are simulated.
- Routes are standard car routes or estimates and are **not guaranteed truck-safe** (no height/weight limits).
- The language setting is saved but the UI is English only.
