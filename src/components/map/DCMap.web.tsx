import { useImperativeHandle, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, G, Path, Polyline, Text as SvgText } from "react-native-svg";
import { colors } from "@/constants/theme";
import { availabilityLevel } from "@/services/availabilityService";
import type { LatLng } from "@/models/types";
import { LEVEL_COLORS } from "../AvailabilityBadge";
import type { DCMapProps } from "./mapTypes";

/**
 * WEB PREVIEW MAP – react-native-maps does not run in a browser.
 * This simple schematic map of Germany lets you test the app on a computer.
 * On a phone (Expo Go / development build) the real Google / Apple map is used.
 */

// Rough outline of Germany (lng, lat)
const GERMANY: [number, number][] = [
  [6.0, 51.85], [5.95, 51.05], [6.1, 50.75], [6.4, 50.32], [6.13, 50.13], [6.35, 49.47], [6.75, 49.17],
  [7.45, 49.17], [8.2, 48.97], [7.6, 47.6], [8.6, 47.65], [9.6, 47.55], [10.2, 47.3], [10.9, 47.5],
  [11.6, 47.58], [12.2, 47.7], [13.0, 47.47], [12.75, 48.1], [13.8, 48.75], [12.5, 49.6], [12.1, 50.3],
  [13.0, 50.5], [14.3, 50.9], [14.8, 50.85], [15.0, 51.1], [14.7, 52.1], [14.15, 52.83], [14.4, 53.3],
  [14.2, 53.9], [13.0, 54.4], [12.3, 54.2], [11.0, 54.0], [10.85, 54.4], [10.0, 54.5], [9.9, 54.8],
  [8.6, 54.9], [8.6, 54.4], [8.9, 53.9], [8.2, 53.6], [7.2, 53.5], [7.0, 53.3], [7.2, 52.6], [6.7, 52.5],
  [6.75, 52.1], [6.0, 51.85],
];

const BOUNDS = { minLat: 47.0, maxLat: 55.2, minLng: 5.3, maxLng: 15.5 };

export default function DCMapWeb({
  ref,
  start,
  destination,
  route,
  facilities,
  highlightedIds,
  selectedId,
  onFacilityPress,
  onMapLongPress,
  onMapPress,
}: DCMapProps) {
  const [size, setSize] = useState({ w: 400, h: 700 });

  useImperativeHandle(ref, () => ({ centerOn: () => {}, fitTo: () => {} }));

  // Fit Germany into the view, keeping the aspect ratio (lng scaled by cos(lat)).
  const k = Math.cos((51 * Math.PI) / 180);
  const geoW = (BOUNDS.maxLng - BOUNDS.minLng) * k;
  const geoH = BOUNDS.maxLat - BOUNDS.minLat;
  const scale = Math.min(size.w / geoW, (size.h * 0.78) / geoH);
  const offX = (size.w - geoW * scale) / 2;
  const offY = size.h * 0.16;

  const project = (c: LatLng) => ({
    x: offX + (c.longitude - BOUNDS.minLng) * k * scale,
    y: offY + (BOUNDS.maxLat - c.latitude) * scale,
  });
  const unproject = (x: number, y: number): LatLng => ({
    longitude: (x - offX) / (k * scale) + BOUNDS.minLng,
    latitude: BOUNDS.maxLat - (y - offY) / scale,
  });

  const outline = GERMANY.map(([lng, lat], i) => {
    const p = project({ latitude: lat, longitude: lng });
    return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ");

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={(e) => {
          const { locationX, locationY } = e.nativeEvent;
          const shift = (e.nativeEvent as unknown as { shiftKey?: boolean }).shiftKey;
          if (onMapLongPress && shift) return onMapLongPress(unproject(locationX, locationY));
          // Find the nearest pin within 24 px of the click.
          let hit: string | null = null;
          let best = 24;
          for (const f of facilities) {
            const p = project(f.coordinate);
            const d = Math.hypot(p.x - locationX, p.y - locationY);
            if (d < best) {
              best = d;
              hit = f.id;
            }
          }
          if (hit) onFacilityPress(hit);
          else onMapPress?.();
        }}
      >
        <Svg width={size.w} height={size.h}>
          <Path d={`M0 0 H${size.w} V${size.h} H0 Z`} fill="#DCE8EA" />
          <Path d={outline + " Z"} fill="#F7F5F0" stroke="#C9C3B6" strokeWidth={2} />
          {route && route.length > 1 ? (
            <Polyline
              points={route.map((c) => { const p = project(c); return `${p.x},${p.y}`; }).join(" ")}
              stroke={colors.navy}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {start ? <Circle {...xy(project(start))} r={9} fill={colors.teal} stroke={colors.white} strokeWidth={3} /> : null}
          {destination ? <Circle {...xy(project(destination))} r={9} fill={colors.navy} stroke={colors.white} strokeWidth={3} /> : null}
          {facilities.map((f) => {
            const p = project(f.coordinate);
            const dim = highlightedIds && highlightedIds.length > 0 && !highlightedIds.includes(f.id);
            const sel = f.id === selectedId;
            const lvl = LEVEL_COLORS[availabilityLevel(f.available)];
            return (
              <G key={f.id} opacity={dim ? 0.4 : 1}>
                <Circle cx={p.x} cy={p.y} r={sel ? 17 : 14} fill={sel ? colors.navy : colors.orange} stroke={colors.white} strokeWidth={3} />
                <Circle cx={p.x + 12} cy={p.y - 12} r={9} fill={lvl.dot} stroke={colors.white} strokeWidth={2} />
                <SvgText x={p.x + 12} y={p.y - 8.5} fontSize={10} fontWeight="bold" fontFamily="sans-serif" fill={colors.white} textAnchor="middle">
                  {String(f.available)}
                </SvgText>
                <SvgText x={p.x} y={p.y + 28} fontSize={11} fontWeight="600" fontFamily="sans-serif" fill={colors.navy} textAnchor="middle">
                  {f.name.replace("DriverConnect ", "").split("-")[0]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </Pressable>
    </View>
  );
}

const xy = (p: { x: number; y: number }) => ({ cx: p.x, cy: p.y });
