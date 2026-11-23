import type { Ref } from "react";
import type { LatLng } from "@/models/types";

export interface MapFacility {
  id: string;
  name: string;
  coordinate: LatLng;
  available: number;
  total: number;
}

export interface DCMapHandle {
  centerOn: (c: LatLng, delta?: number) => void;
  fitTo: (coords: LatLng[]) => void;
}

export interface DCMapProps {
  ref?: Ref<DCMapHandle>;
  initialCenter: LatLng;
  showUser?: boolean;
  start?: LatLng | null;
  destination?: LatLng | null;
  route?: LatLng[];
  facilities: MapFacility[];
  highlightedIds?: string[];
  selectedId?: string | null;
  onFacilityPress: (id: string) => void;
  onMapLongPress?: (c: LatLng) => void;
  onMapPress?: () => void;
  edgePadding?: { top: number; right: number; bottom: number; left: number };
}
