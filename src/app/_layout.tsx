import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Image, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { LogoMark } from "@/components/Logo";
import { colors } from "@/constants/theme";
import { AppProvider, useApp } from "@/context/AppContext";

// Keep the native splash screen (the DriverConnect logo) visible until the app is ready.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 400 });

const FULL_LOGO = require("@/assets/images/logo-full.png"); // 900 × 281

/** Loading page: the full DriverConnect logo, same as the native splash screen. */
function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.offWhite, gap: 32, padding: 24 }}>
      <Image source={FULL_LOGO} style={{ width: 260, maxWidth: "80%", aspectRatio: 900 / 281 }} resizeMode="contain" />
      <ActivityIndicator color={colors.navy} />
    </View>
  );
}

function RootStack() {
  const { ready } = useApp();
  const [fontsLoaded, fontError] = useFonts({ Poppins_600SemiBold, Poppins_700Bold });
  const appReady = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  if (!appReady) return <LoadingScreen />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.offWhite },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.offWhite },
        headerRight: () => (
          <View style={{ paddingHorizontal: 12 }}>
            <LogoMark size={26} />
          </View>
        ),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="facility/[id]" options={{ title: "Facility" }} />
      <Stack.Screen name="checkout/[id]" options={{ title: "Checkout" }} />
      <Stack.Screen name="booking/[id]" options={{ title: "Booking" }} />
      <Stack.Screen name="scan" options={{ title: "Entrance scanner" }} />
      <Stack.Screen name="account/personal" options={{ title: "Personal information" }} />
      <Stack.Screen name="account/payments" options={{ title: "Payment methods" }} />
      <Stack.Screen name="account/transactions" options={{ title: "Transaction history" }} />
      <Stack.Screen name="account/receipt/[id]" options={{ title: "Receipt" }} />
      <Stack.Screen name="account/settings" options={{ title: "Settings" }} />
      <Stack.Screen name="account/about" options={{ title: "About DriverConnect" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <RootStack />
      </AppProvider>
    </SafeAreaProvider>
  );
}
