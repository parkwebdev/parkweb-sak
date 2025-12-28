/* MapLibre GL Map Component - Free unlimited maps with OpenFreeMap tiles */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  FullscreenControl,
  Marker,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "@/components/ThemeProvider";
import { RefreshCcw01, ChevronDown, LayersThree01 } from "@untitledui/icons";
import { logger } from "@/utils/logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Map style options using OpenFreeMap (free, no API key required)
type MapStyleKey = "liberty" | "bright" | "positron";

interface MapStyleOption {
  label: string;
  light: string;
  dark: string;
}

const MAP_STYLE_OPTIONS: Record<MapStyleKey, MapStyleOption> = {
  liberty: {
    label: "Liberty",
    light: "https://tiles.openfreemap.org/styles/liberty",
    dark: "https://tiles.openfreemap.org/styles/liberty",
  },
  bright: {
    label: "Bright",
    light: "https://tiles.openfreemap.org/styles/bright",
    dark: "https://tiles.openfreemap.org/styles/bright",
  },
  positron: {
    label: "Positron",
    light: "https://tiles.openfreemap.org/styles/positron",
    dark: "https://tiles.openfreemap.org/styles/positron",
  },
};

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  count: number;
  country: string;
  city?: string;
  countryCode?: string;
}

interface MapLibreMapProps {
  className?: string;
  style?: React.CSSProperties;
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  fitBounds?: [[number, number], [number, number]];
  fitBoundsPadding?: number;
  showControls?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
}

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function getMarkerSize(count: number, maxCount: number): number {
  const ratio = count / maxCount;
  if (ratio >= 0.6) return 32;
  if (ratio >= 0.3) return 26;
  return 20;
}

function getMarkerFillColor(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio >= 0.6) return "#ef4444";
  if (ratio >= 0.3) return "#f59e0b";
  return "#22c55e";
}

// Layer configurations (using any to avoid complex type resolution)
const clusterLayer: any = {
  id: "clusters",
  type: "circle",
  source: "visitors",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": ["step", ["get", "point_count"], "#22c55e", 5, "#f59e0b", 15, "#ef4444"],
    "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 20, 10, 28, 50, 40],
    "circle-stroke-width": 3,
    "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
    "circle-opacity": 0.95,
  },
};

const clusterCountLayer: any = {
  id: "cluster-count",
  type: "symbol",
  source: "visitors",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["Noto Sans Regular"],
    "text-size": 14,
    "text-allow-overlap": true,
  },
  paint: { "text-color": "#ffffff" },
};

const heatmapLayer: any = {
  id: "heatmap",
  type: "heatmap",
  source: "visitors",
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "count"], 0, 0, 10, 0.5, 50, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.5, 9, 2],
    "heatmap-color": [
      "interpolate", ["linear"], ["heatmap-density"],
      0, "rgba(33, 102, 172, 0)",
      0.2, "rgba(103, 169, 207, 0.6)",
      0.4, "rgba(209, 229, 240, 0.7)",
      0.6, "rgba(253, 219, 199, 0.8)",
      0.8, "rgba(239, 138, 98, 0.9)",
      1, "rgba(178, 24, 43, 1)",
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 15, 9, 30],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.8, 9, 0.4],
  },
};

interface PopupInfo {
  lng: number;
  lat: number;
  country: string;
  city?: string;
  count: number;
  countryCode?: string;
  isCluster?: boolean;
  pointCount?: number;
}

function FilledMapPin({ size = 24, fillColor, className }: { size?: number; fillColor: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" fill="white" />
      <path d="M12 22C12 22 20 16 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 16 12 22 12 22Z" fill={fillColor} stroke={fillColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" fill="white" />
    </svg>
  );
}

export function MapLibreMap({
  className,
  style,
  center = [0, 20],
  zoom = 1.5,
  markers = [],
  fitBounds,
  fitBoundsPadding = 50,
  showControls = true,
  onMarkerClick,
}: MapLibreMapProps) {
  const mapRef = React.useRef<any>(null);
  const { theme: currentTheme } = useTheme();
  const [popupInfo, setPopupInfo] = React.useState<PopupInfo | null>(null);
  const [selectedStyleKey, setSelectedStyleKey] = React.useState<MapStyleKey>("liberty");
  const [mapStyle, setMapStyle] = React.useState(MAP_STYLE_OPTIONS.liberty.light);
  const [showHeatmap, setShowHeatmap] = React.useState(false);
  const initialBoundsRef = React.useRef(fitBounds);

  React.useEffect(() => {
    const styleOption = MAP_STYLE_OPTIONS[selectedStyleKey];
    const resolveStyle = () => {
      if (currentTheme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? styleOption.dark : styleOption.light;
      }
      return currentTheme === "dark" ? styleOption.dark : styleOption.light;
    };
    setMapStyle(resolveStyle());

    if (currentTheme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setMapStyle(mql.matches ? styleOption.dark : styleOption.light);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [currentTheme, selectedStyleKey]);

  React.useEffect(() => {
    if (fitBounds) initialBoundsRef.current = fitBounds;
  }, [fitBounds]);

  const maxCount = React.useMemo(() => Math.max(...markers.map((m) => m.count), 1), [markers]);

  const geojsonData = React.useMemo(() => ({
    type: "FeatureCollection" as const,
    features: markers.map((marker) => ({
      type: "Feature" as const,
      properties: { id: marker.id, count: marker.count, country: marker.country, city: marker.city || "", countryCode: marker.countryCode || "" },
      geometry: { type: "Point" as const, coordinates: [marker.lng, marker.lat] },
    })),
  }), [markers]);

  const onMapLoad = React.useCallback(() => {
    logger.debug("[MapLibreMap] Map loaded successfully");
    if (fitBounds && mapRef.current) {
      mapRef.current.fitBounds(fitBounds, { padding: fitBoundsPadding, maxZoom: 6 });
    }
  }, [fitBounds, fitBoundsPadding]);

  const onClick = React.useCallback((event: any) => {
    const feature = event.features?.[0];
    if (!feature || !mapRef.current) return;
    const geometry = feature.geometry;
    if (geometry.type !== "Point") return;
    const clusterId = feature.properties?.cluster_id;
    if (clusterId !== undefined) {
      const source = mapRef.current.getSource("visitors");
      if (source && "getClusterExpansionZoom" in source) {
        (source as any).getClusterExpansionZoom(clusterId, (err: any, zoomLevel: number) => {
          if (err) return;
          mapRef.current?.easeTo({ center: geometry.coordinates, zoom: zoomLevel, duration: 500 });
        });
      }
    }
  }, []);

  const onMouseEnter = React.useCallback((event: any) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const geometry = feature.geometry;
    if (geometry.type !== "Point") return;
    const props = feature.properties;
    const [lng, lat] = geometry.coordinates;
    if (props?.cluster_id !== undefined) {
      setPopupInfo({ lng, lat, country: "", count: 0, isCluster: true, pointCount: props.point_count || 0 });
    }
  }, []);

  const onMouseLeave = React.useCallback(() => setPopupInfo(null), []);

  const resetView = React.useCallback(() => {
    if (!mapRef.current) return;
    if (initialBoundsRef.current) {
      mapRef.current.fitBounds(initialBoundsRef.current, { padding: fitBoundsPadding, maxZoom: 6, duration: 500 });
    } else {
      mapRef.current.easeTo({ center, zoom, duration: 500 });
    }
  }, [center, zoom, fitBoundsPadding]);

  const handleMarkerEnter = React.useCallback((marker: MapMarker) => {
    setPopupInfo({ lng: marker.lng, lat: marker.lat, country: marker.country, city: marker.city, count: marker.count, countryCode: marker.countryCode, isCluster: false });
  }, []);

  const handleMarkerLeave = React.useCallback(() => setPopupInfo(null), []);

  return (
    <div className={`relative ${className || ""}`} style={style}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={["clusters"]}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onLoad={onMapLoad}
        cursor={popupInfo ? "pointer" : "grab"}
      >
        {showControls && (
          <>
            <NavigationControl position="top-right" showCompass={false} />
            <FullscreenControl position="top-right" />
          </>
        )}

        <Source id="visitors" type="geojson" data={geojsonData} cluster={!showHeatmap} clusterMaxZoom={14} clusterRadius={50}>
          {showHeatmap && <Layer {...heatmapLayer} />}
          {!showHeatmap && (
            <>
              <Layer {...clusterLayer} />
              <Layer {...clusterCountLayer} />
            </>
          )}
        </Source>

        {!showHeatmap && markers.map((marker) => (
          <Marker key={marker.id} longitude={marker.lng} latitude={marker.lat} anchor="bottom">
            <div
              className={cn("relative", onMarkerClick ? "cursor-pointer" : "cursor-default", "transition-all duration-300 ease-out", onMarkerClick && "hover:scale-110 hover:-translate-y-1", "animate-fade-in")}
              onMouseEnter={() => handleMarkerEnter(marker)}
              onMouseLeave={handleMarkerLeave}
              onClick={() => onMarkerClick?.(marker)}
            >
              <FilledMapPin size={getMarkerSize(marker.count, maxCount)} fillColor={getMarkerFillColor(marker.count, maxCount)} className="drop-shadow-lg" />
              <span className="absolute inset-0 flex items-center justify-center text-white text-2xs font-bold -mt-1.5 pointer-events-none">
                {marker.count > 99 ? "99+" : marker.count}
              </span>
            </div>
          </Marker>
        ))}

        {popupInfo && (
          <Popup longitude={popupInfo.lng} latitude={popupInfo.lat} closeButton={false} closeOnClick={false} offset={25} className="visitor-map-popup">
            {popupInfo.isCluster ? (
              <div className="p-2 text-center font-sans">
                <div className="text-lg font-bold">{popupInfo.pointCount}</div>
                <div className="text-xs opacity-70">locations</div>
                <div className="text-2xs mt-1 opacity-50">Click to expand</div>
              </div>
            ) : (
              <div className="p-2 font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{countryCodeToFlag(popupInfo.countryCode || "")}</span>
                  <div>
                    <div className="font-semibold text-sm">{popupInfo.country}</div>
                    {popupInfo.city && <div className="text-xs opacity-70">{popupInfo.city}</div>}
                  </div>
                </div>
                <div className="text-sm font-medium">
                  <span className="text-lg font-bold">{popupInfo.count}</span> visitor{popupInfo.count !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </Popup>
        )}
      </Map>

      {showControls && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm border-border shadow-md gap-1">
                {MAP_STYLE_OPTIONS[selectedStyleKey].label}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(MAP_STYLE_OPTIONS) as MapStyleKey[]).map((key) => (
                <DropdownMenuItem key={key} onClick={() => setSelectedStyleKey(key)} className={cn(selectedStyleKey === key && "bg-accent")}>
                  {MAP_STYLE_OPTIONS[key].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 shadow-md">
            <LayersThree01 size={14} className={cn(showHeatmap && "text-orange-500")} />
            <Label htmlFor="heatmap-toggle" className="text-xs font-medium cursor-pointer">Heatmap</Label>
            <Switch id="heatmap-toggle" checked={showHeatmap} onCheckedChange={setShowHeatmap} className="scale-75" />
          </div>
        </div>
      )}

      {showControls && (
        <button onClick={resetView} className="absolute bottom-4 right-4 p-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-md hover:bg-muted transition-colors z-10" title="Reset view">
          <RefreshCcw01 size={16} />
        </button>
      )}

      {showControls && markers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs z-10">
          <div className="font-medium mb-2">{showHeatmap ? "Density intensity" : "Visitor density"}</div>
          {showHeatmap ? (
            <div className="flex items-center gap-1">
              <div className="w-24 h-3 rounded-sm bg-gradient-to-r from-blue-400 via-yellow-200 to-red-600" />
              <span className="text-2xs ml-1">Low → High</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2"><FilledMapPin size={14} fillColor="#22c55e" /><span>Low</span></div>
              <div className="flex items-center gap-2"><FilledMapPin size={14} fillColor="#f59e0b" /><span>Medium</span></div>
              <div className="flex items-center gap-2"><FilledMapPin size={14} fillColor="#ef4444" /><span>High</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function computeBounds(coordinates: Array<{ lng: number; lat: number }>): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
  }
  if (minLng === maxLng && minLat === maxLat) {
    return [[minLng - 10, minLat - 10], [maxLng + 10, maxLat + 10]];
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}
