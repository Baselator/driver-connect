import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HAS_GOOGLE_KEY } from "@/config/appConfig";
import { colors, radius, spacing, type } from "@/constants/theme";
import type { LatLng, PlaceResult } from "@/models/types";
import { resolvePlace, searchPlaces } from "@/services/placesService";
import { Icon } from "./ui";

export interface PickedPlace {
  title: string;
  coordinate: LatLng;
}

/** Full-screen search for the start point or destination. */
export function PlaceSearchModal({
  visible,
  mode,
  near,
  onClose,
  onPick,
  onUseCurrentLocation,
}: {
  visible: boolean;
  mode: "start" | "destination";
  near?: LatLng;
  onClose: () => void;
  onPick: (p: PickedPlace) => void;
  onUseCurrentLocation?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const r = await searchPlaces(query, near);
      if (!cancelled) {
        setResults(r);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, visible, near]);

  const pick = async (p: PlaceResult) => {
    setLoading(true);
    const coordinate = await resolvePlace(p);
    setLoading(false);
    if (coordinate) {
      onPick({ title: p.title, coordinate });
      setQuery("");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.back}>
            <Icon name="arrow-left" size={26} />
          </Pressable>
          <View style={styles.inputWrap}>
            <Icon name="magnify" color={colors.textMuted} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={(q) => {
                setQuery(q);
                setLoading(true);
              }}
              placeholder={mode === "start" ? "Search start point" : "Where are you driving to?"}
              placeholderTextColor={colors.gray}
              style={styles.input}
              returnKeyType="search"
            />
            {loading ? <ActivityIndicator color={colors.navy} /> : null}
          </View>
        </View>

        {mode === "start" && onUseCurrentLocation ? (
          <Pressable style={styles.result} onPress={onUseCurrentLocation}>
            <View style={[styles.resultIcon, { backgroundColor: colors.tealLight }]}>
              <Icon name="crosshairs-gps" color={colors.tealDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>Use current location</Text>
              <Text style={type.small}>GPS (Münster if unavailable)</Text>
            </View>
          </Pressable>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={styles.result} onPress={() => pick(item)}>
              <View style={styles.resultIcon}>
                <Icon name="map-marker-outline" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={type.small}>{item.subtitle}</Text> : null}
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            <Text style={[type.tiny, { padding: spacing.lg }]}>
              {HAS_GOOGLE_KEY
                ? "Results by Google Places."
                : "Offline demo search (major logistics cities). Add a Google API key in .env for full address search."}
              {mode === "start" ? "\nTip: you can also long-press on the map to set a start point." : ""}
            </Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.lg },
  back: { padding: 4 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 17, color: colors.text, paddingVertical: 10 },
  result: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  resultIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
});
