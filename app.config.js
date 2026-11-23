// DriverConnect – Expo app configuration.
// The Google key is read from the .env file (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY).
// Without a key the app still works: it uses offline city search and estimated routes.
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

module.exports = {
  expo: {
    name: "DriverConnect",
    slug: "driver-connect",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "driverconnect",
    userInterfaceStyle: "light",
    backgroundColor: "#F3F0EA",
    ios: {
      bundleIdentifier: "com.driverconnect.app",
      supportsTablet: false,
    },
    android: {
      package: "com.driverconnect.app",
      adaptiveIcon: {
        backgroundColor: "#F3F0EA",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "single",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#F3F0EA",
          image: "./assets/images/splash-logo.png",
          imageWidth: 260,
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "DriverConnect uses your location to show your route and nearby truck parking.",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
            "DriverConnect uses the camera to scan booking QR codes at the facility entrance.",
          barcodeScannerEnabled: true,
        },
      ],
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: GOOGLE_KEY,
          iosGoogleMapsApiKey: GOOGLE_KEY,
        },
      ],
    ],
    experiments: {
      typedRoutes: false,
      reactCompiler: true,
    },
  },
};
