"use client";

import * as React from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  FullscreenControl,
  type MapRef,
  type MapMouseEvent,
} from "react-map-gl/mapbox";
import type { CircleLayer, SymbolLayer } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "@/components/ThemeProvider";
import { RefreshCcw01 } from "@untitledui/icons";
import { logger } from "@/utils/logger";

// Mapbox vector styles
const MAPBOX_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
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

interface MapboxMapProps {
  className?: string;
  style?: React.CSSProperties;
  accessToken: string;
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  fitBounds?: [[number, number], [number, number]];
  fitBoundsPadding?: number;
  showControls?: boolean;
}

// Country code to flag emoji
function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

// Color based on count
function getMarkerColor(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio >= 0.6) return "#ef4444";
  if (ratio >= 0.3) return "#f59e0b";
  return "#22c55e";
}

// Cluster layer style
const clusterLayer: CircleLayer = {
  id: "clusters",
  type: "circle",
  source: "visitors",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": ["step", ["get", "point_count"], "#22c55e", 5, "#f59e0b", 15, "#ef4444"],
    "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 32],
    "circle-stroke-width": 3,
    "circle-stroke-color": "rgba(255, 255, 255, 0.8)",
    "circle-opacity": 0.9,
  },
};

// Cluster count label
const clusterCountLayer: SymbolLayer = {
  id: "cluster-count",
  type: "symbol",
  source: "visitors",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 14,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

// Individual point layer
const unclusteredPointLayer: CircleLayer = {
  id: "unclustered-point",
  type: "circle",
  source: "visitors",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": ["get", "color"],
    "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 10, 50, 22, 200, 30],
    "circle-stroke-width": 3,
    "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
    "circle-opacity": 0.85,
  },
};

// Point count label
const unclusteredCountLayer: SymbolLayer = {
  id: "unclustered-count",
  type: "symbol",
  source: "visitors",
  filter: ["!", ["has", "point_count"]],
  layout: {
    "text-field": ["get", "count"],
    "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
  paint: {
    "text-color": "#ffffff",
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

export function MapboxMap({
  className,
  style,
  accessToken,
  center = [0, 20],
  zoom = 1.5,
  markers = [],
  fitBounds,
  fitBoundsPadding = 50,
  showControls = true,
}: MapboxMapProps) {
  const mapRef = React.useRef<MapRef>(null);
  const { theme: currentTheme } = useTheme();
  const [popupInfo, setPopupInfo] = React.useState<PopupInfo | null>(null);
  const [mapStyle, setMapStyle] = React.useState(MAPBOX_STYLES.light);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const initialBoundsRef = React.useRef(fitBounds);

  // Debug: Log token fingerprint on mount (safe - only first/last chars)
  React.useEffect(() => {
    if (accessToken) {
      const fingerprint = `${accessToken.substring(0, 10)}...${accessToken.substring(accessToken.length - 6)}`;
      logger.debug(`[MapboxMap] Token fingerprint: ${fingerprint}`);
      logger.debug(`[MapboxMap] Current origin: ${window.location.origin}`);
    } else {
      logger.warn("[MapboxMap] No access token provided");
    }
  }, [accessToken]);

  // Resolve theme to map style
  React.useEffect(() => {
    const resolveStyle = () => {
      if (currentTheme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? MAPBOX_STYLES.dark
          : MAPBOX_STYLES.light;
      }
      return currentTheme === "dark" ? MAPBOX_STYLES.dark : MAPBOX_STYLES.light;
    };
    setMapStyle(resolveStyle());

    if (currentTheme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setMapStyle(mql.matches ? MAPBOX_STYLES.dark : MAPBOX_STYLES.light);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [currentTheme]);

  // Store initial bounds
  React.useEffect(() => {
    if (fitBounds) {
      initialBoundsRef.current = fitBounds;
    }
  }, [fitBounds]);

  // Convert markers to GeoJSON
  const geojsonData = React.useMemo(() => {
    const maxCount = Math.max(...markers.map((m) => m.count), 1);
    return {
      type: "FeatureCollection" as const,
      features: markers.map((marker) => ({
        type: "Feature" as const,
        properties: {
          id: marker.id,
          count: marker.count,
          country: marker.country,
          city: marker.city || "",
          countryCode: marker.countryCode || "",
          color: getMarkerColor(marker.count, maxCount),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [marker.lng, marker.lat],
        },
      })),
    };
  }, [markers]);

  // Handle map load - fit bounds
  const onMapLoad = React.useCallback(() => {
    logger.debug("[MapboxMap] Map loaded successfully - style tiles should be rendering");
    setMapLoaded(true);
    setMapError(null);
    if (fitBounds && mapRef.current) {
      mapRef.current.fitBounds(fitBounds, {
        padding: fitBoundsPadding,
        maxZoom: 6,
      });
    }
  }, [fitBounds, fitBoundsPadding]);

  // Handle map errors
  const onMapError = React.useCallback((evt: { error?: { message?: string } }) => {
    const errorMsg = evt?.error?.message || "Unknown map error";
    logger.error("[MapboxMap] Map error:", { errorMsg, evt });
    setMapError(errorMsg);
  }, []);

  // Handle cluster click - zoom in
  const onClick = React.useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature || !mapRef.current) return;

    const geometry = feature.geometry;
    if (geometry.type !== "Point") return;

    const clusterId = feature.properties?.cluster_id;
    if (clusterId !== undefined) {
      // It's a cluster - zoom to expand
      const mapboxSource = mapRef.current.getSource("visitors");
      if (mapboxSource && "getClusterExpansionZoom" in mapboxSource) {
        const source = mapboxSource as unknown as {
          getClusterExpansionZoom: (id: number, cb: (err: Error | null, zoom: number) => void) => void;
        };
        source.getClusterExpansionZoom(clusterId, (err, zoomLevel) => {
          if (err) return;
          mapRef.current?.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoomLevel,
          });
        });
      }
    }
  }, []);

  // Handle mouse enter on points
  const onMouseEnter = React.useCallback((event: MapMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) return;

    const geometry = feature.geometry;
    if (geometry.type !== "Point") return;

    const props = feature.properties;
    const [lng, lat] = geometry.coordinates;

    if (props?.cluster_id !== undefined) {
      // Cluster popup
      setPopupInfo({
        lng,
        lat,
        country: "",
        count: 0,
        isCluster: true,
        pointCount: props.point_count || 0,
      });
    } else {
      // Single point popup
      setPopupInfo({
        lng,
        lat,
        country: props?.country || "Unknown",
        city: props?.city || undefined,
        count: props?.count || 0,
        countryCode: props?.countryCode || undefined,
        isCluster: false,
      });
    }
  }, []);

  const onMouseLeave = React.useCallback(() => {
    setPopupInfo(null);
  }, []);

  // Reset view
  const resetView = React.useCallback(() => {
    if (!mapRef.current) return;
    if (initialBoundsRef.current) {
      mapRef.current.fitBounds(initialBoundsRef.current, {
        padding: fitBoundsPadding,
        maxZoom: 6,
      });
    } else {
      mapRef.current.easeTo({ center, zoom, duration: 500 });
    }
  }, [center, zoom, fitBoundsPadding]);

  return (
    <div className={`relative ${className || ""}`} style={style}>
      <Map
        ref={mapRef}
        mapboxAccessToken={accessToken}
        initialViewState={{
          longitude: center[0],
          latitude: center[1],
          zoom: zoom,
        }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={["clusters", "unclustered-point"]}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onLoad={onMapLoad}
        onError={onMapError}
        cursor={popupInfo ? "pointer" : "grab"}
      >
        {showControls && (
          <>
            <NavigationControl position="top-right" showCompass={false} />
            <FullscreenControl position="top-right" />
          </>
        )}

        <Source
          id="visitors"
          type="geojson"
          data={geojsonData}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
          <Layer {...unclusteredCountLayer} />
        </Source>

        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            closeButton={false}
            closeOnClick={false}
            offset={15}
            className="visitor-map-popup"
          >
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
                  <span className="text-lg font-bold">{popupInfo.count}</span> visitor
                  {popupInfo.count !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </Popup>
        )}
      </Map>

      {/* Reset view button */}
      {showControls && (
        <button
          onClick={resetView}
          className="absolute bottom-4 right-4 p-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-md hover:bg-muted transition-colors z-10"
          title="Reset view"
        >
          <RefreshCcw01 size={16} />
        </button>
      )}

      {/* Legend */}
      {showControls && markers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs z-10">
          <div className="font-medium mb-2">Visitor density</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-active" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-status-scheduled" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              <span>High</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compute bounds from coordinates
export function computeBounds(
  coordinates: Array<{ lng: number; lat: number }>
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
  }

  // Add padding for single points
  if (minLng === maxLng && minLat === maxLat) {
    return [
      [minLng - 10, minLat - 10],
      [maxLng + 10, maxLat + 10],
    ];
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
