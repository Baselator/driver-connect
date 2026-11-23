import Constants from "expo-constants";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
import { HAS_GOOGLE_KEY } from "@/config/appConfig";
import { colors } from "@/constants/theme";
import { availabilityLevel } from "@/services/availabilityService";
import { LEVEL_COLORS } from "../AvailabilityBadge";
import { Icon } from "../ui";
import type { DCMapProps } from "./mapTypes";

// Android always uses Google Maps. iOS uses Google Maps in a development build with a key,
// and Apple Maps in Expo Go (Expo Go on iOS does not include the Google Maps SDK).
const isExpoGo = Constants.executionEnvironment === "storeClient";
const PROVIDER = Platform.OS === "android" || (HAS_GOOGLE_KEY && !isExpoGo) ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

/** Native map (iOS & Android). The web version lives in DCMap.web.tsx. */
export default function DCMap({
  ref,
  initialCenter,
  showUser = true,
  start,
  destination,
  route,
  facilities,
  highlightedIds,
  selectedId,
  onFacilityPress,
  onMapLongPress,
  onMapPress,
  edgePadding = { top: 220, right: 60, bottom: 260, left: 60 },
}: DCMapProps) {
  const mapRef = useRef<MapView>(null);

  // Custom marker views must be re-drawn when their content changes, then frozen for performance.
  const signature = facilities.map((f) => `${f.id}:${f.available}`).join("|") + (highlightedIds ?? []).join() + selectedId;
  const [frozenSignature, setFrozenSignature] = useState("");
  const tracks = frozenSignature !== signature;
  useEffect(() => {
    const t = setTimeout(() => setFrozenSignature(signature), 800);
    return () => clearTimeout(t);
  }, [signature]);

  useImperativeHandle(ref, () => ({
    centerOn: (c, delta = 0.4) =>
      mapRef.current?.animateToRegion({ ...c, latitudeDelta: delta, longitudeDelta: delta }, 600),
    fitTo: (coords) => {
      if (coords.length) mapRef.current?.fitToCoordinates(coords, { edgePadding, animated: true });
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER}
      initialRegion={{ ...initialCenter, latitudeDelta: 4, longitudeDelta: 4 }}
      showsUserLocation={showUser}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      onLongPress={(e) => onMapLongPress?.(e.nativeEvent.coordinate)}
      onPress={(e) => {
        if (e.nativeEvent.action !== "marker-press") onMapPress?.();
      }}
    >
      {route && route.length > 1 ? (
        <Polyline coordinates={route} strokeColor={colors.navy} strokeWidth={5} lineCap="round" />
      ) : null}

      {start ? (
        <Marker coordinate={start} title="Start" tracksViewChanges={tracks} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.endpoint, { backgroundColor: colors.teal }]}>
            <Icon name="truck" size={16} color={colors.white} />
          </View>
        </Marker>
      ) : null}

      {destination ? (
        <Marker coordinate={destination} title="Destination" tracksViewChanges={tracks} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.endpoint, { backgroundColor: colors.navy }]}>
            <Icon name="flag-checkered" size={16} color={colors.white} />
          </View>
        </Marker>
      ) : null}

      {facilities.map((f) => {
        const level = availabilityLevel(f.available);
        const dimmed = highlightedIds && highlightedIds.length > 0 && !highlightedIds.includes(f.id);
        const selected = f.id === selectedId;
        return (
          <Marker
            key={f.id}
            coordinate={f.coordinate}
            onPress={() => onFacilityPress(f.id)}
            tracksViewChanges={tracks}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={selected ? 10 : 1}
          >
            <View style={[styles.markerWrap, dimmed && { opacity: 0.45 }]}>
              <View style={[styles.pin, selected && styles.pinSelected]}>
                <Icon name="truck" size={selected ? 18 : 15} color={colors.white} />
                <View style={[styles.count, { backgroundColor: LEVEL_COLORS[level].dot }]}>
                  <Text style={styles.countText}>{f.available}</Text>
                </View>
              </View>
              <View style={styles.pinTip} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerWrap: { alignItems: "center", padding: 6 },
  pin: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orange,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  pinSelected: { minWidth: 46, height: 46, borderRadius: 23, backgroundColor: colors.navy },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.white,
    marginTop: -2,
  },
  count: {
    position: "absolute",
    top: -8,
    right: -10,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  countText: { color: colors.white, fontWeight: "800", fontSize: 11 },
  endpoint: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
});
