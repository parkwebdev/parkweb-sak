/* MapLibre GL Map Component - Free unlimited maps with CARTO basemaps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import maplibregl, { Map as MapLibreInstance, MapMouseEvent, GeoJSONSource } from "maplibre-gl";
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

// Map style options using CARTO basemaps (free, no API key required)
type MapStyleKey = "voyager" | "positron" | "darkMatter";

interface MapStyleOption {
  label: string;
  light: string;
  dark: string;
}

const MAP_STYLE_OPTIONS: Record<MapStyleKey, MapStyleOption> = {
  voyager: {
    label: "Voyager",
    light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  positron: {
    label: "Positron",
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  darkMatter: {
    label: "Dark Matter",
    light: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
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
  if (!code || code.length !== 2) return "";
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

function createPinSVG(fillColor: string, size: number): string {
  // Solid pin without inner circle for clearer text overlay
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 20 16 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 16 12 22 12 22Z" fill="${fillColor}" stroke="${fillColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;
}

function buildGeoJson(markers: MapMarker[]) {
  return {
    type: "FeatureCollection" as const,
    features: markers.map((m) => ({
      type: "Feature" as const,
      properties: {
        id: m.id,
        count: m.count,
        country: m.country,
        city: m.city || "",
        countryCode: m.countryCode || "",
      },
      geometry: {
        type: "Point" as const,
        coordinates: [m.lng, m.lat] as [number, number],
      },
    })),
  };
}

// Heatmap paint properties for light backgrounds
const HEATMAP_PAINT_LIGHT = {
  "heatmap-weight": [
    "interpolate",
    ["linear"],
    ["get", "count"],
    0, 0,
    5, 0.5,
    20, 1,
  ],
  "heatmap-intensity": [
    "interpolate",
    ["linear"],
    ["zoom"],
    0, 1.5,
    9, 4,
  ],
  "heatmap-color": [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0, "rgba(0, 0, 255, 0)",
    0.1, "rgba(65, 182, 196, 0.6)",
    0.3, "rgba(127, 205, 187, 0.75)",
    0.5, "rgba(199, 233, 180, 0.85)",
    0.7, "rgba(254, 178, 76, 0.9)",
    0.9, "rgba(240, 59, 32, 0.95)",
    1, "rgba(189, 0, 38, 1)",
  ],
  "heatmap-radius": [
    "interpolate",
    ["linear"],
    ["zoom"],
    0, 30,
    9, 50,
  ],
  "heatmap-opacity": [
    "interpolate",
    ["linear"],
    ["zoom"],
    0, 1,
    7, 0.95,
    12, 0.8,
  ],
};

// Heatmap paint properties for dark backgrounds (brighter, more saturated)
const HEATMAP_PAINT_DARK = {
  "heatmap-weight": [
    "interpolate",
    ["linear"],
    ["get", "count"],
    0, 0,
    5, 0.5,
    20, 1,
  ],
  "heatmap-intensity": [
    "interpolate",
    ["linear"],
    ["zoom"],
    0, 2,
    9, 5,
  ],
  "heatmap-color": [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0, "rgba(0, 0, 255, 0)",
    0.1, "rgba(0, 255, 255, 0.5)",
    0.3, "rgba(0, 255, 128, 0.65)",
    0.5, "rgba(255, 255, 0, 0.75)",
    0.7, "rgba(255, 165, 0, 0.85)",
    0.9, "rgba(255, 69, 0, 0.92)",
    1, "rgba(255, 0, 64, 1)",
  ],
  "heatmap-radius": [
    "interpolate",
    ["linear"],
    ["zoom"],
    0, 35,
    9, 55,
  ],
  "heatmap-opacity": [
    "interpolate",
    ["linear"],
    ["zoom"],
    0, 1,
    7, 0.95,
    12, 0.85,
  ],
};

// Helper to get appropriate heatmap paint based on style
function getHeatmapPaint(styleUrl: string) {
  const isDark = styleUrl.includes("dark-matter");
  return isDark ? HEATMAP_PAINT_DARK : HEATMAP_PAINT_LIGHT;
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
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<MapLibreInstance | null>(null);
  const markersRef = React.useRef<maplibregl.Marker[]>([]);
  const clusterLabelsRef = React.useRef<HTMLDivElement[]>([]);
  const hoverPopupRef = React.useRef<maplibregl.Popup | null>(null);
  const initialBoundsRef = React.useRef(fitBounds);

  const { theme: currentTheme } = useTheme();
  const [selectedStyleKey, setSelectedStyleKey] = React.useState<MapStyleKey>("voyager");
  const [mapStyle, setMapStyle] = React.useState(MAP_STYLE_OPTIONS.voyager.light);
  const [showHeatmap, setShowHeatmap] = React.useState(false);

  React.useEffect(() => {
    if (fitBounds) initialBoundsRef.current = fitBounds;
  }, [fitBounds]);

  React.useEffect(() => {
    const styleOption = MAP_STYLE_OPTIONS[selectedStyleKey];
    const resolveStyle = () => {
      if (currentTheme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? styleOption.dark
          : styleOption.light;
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

  const maxCount = React.useMemo(
    () => Math.max(...markers.map((m) => m.count), 1),
    [markers]
  );

  const resetView = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (initialBoundsRef.current) {
      map.fitBounds(initialBoundsRef.current as any, {
        padding: fitBoundsPadding,
        maxZoom: 6,
        duration: 500,
      });
      return;
    }

    map.easeTo({ center, zoom, duration: 500 });
  }, [center, zoom, fitBoundsPadding]);

  // Render HTML cluster labels using Geist font
  const updateClusterLabels = React.useCallback(() => {
    const map = mapRef.current;
    if (!map || showHeatmap) {
      // Clear labels if heatmap is on
      clusterLabelsRef.current.forEach((el) => el.remove());
      clusterLabelsRef.current = [];
      return;
    }

    // Clear existing labels
    clusterLabelsRef.current.forEach((el) => el.remove());
    clusterLabelsRef.current = [];

    // Query cluster features from the map
    if (!map.getSource("visitors") || !map.getLayer("clusters")) return;

    const features = map.queryRenderedFeatures({ layers: ["clusters"] });

    features.forEach((feature) => {
      const props = feature.properties as any;
      if (!props?.point_count) return;

      const coords = (feature.geometry as any).coordinates as [number, number];
      const point = map.project(coords);

      const el = document.createElement("div");
      el.className = "absolute pointer-events-none font-sans text-sm font-bold text-white";
      el.style.transform = "translate(-50%, -50%)";
      el.style.left = `${point.x}px`;
      el.style.top = `${point.y}px`;
      el.style.zIndex = "5";
      el.textContent = props.point_count_abbreviated || props.point_count.toString();

      containerRef.current?.appendChild(el);
      clusterLabelsRef.current.push(el);
    });
  }, [showHeatmap]);

  // Create map instance once
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center,
      zoom,
      attributionControl: {},
      interactive: true,
    });

    mapRef.current = map;

    map.on("error", (e) => {
      logger.warn("[MapLibreMap] Map error:", e.error?.message || e);
    });

    map.on("load", () => {
      logger.debug("[MapLibreMap] Map loaded successfully");

      if (fitBounds) {
        map.fitBounds(fitBounds as any, {
          padding: fitBoundsPadding,
          maxZoom: 6,
        });
      }

      // Add controls
      if (showControls) {
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibregl.FullscreenControl(), "top-right");
      }

      // Data source for clusters/heatmap
      map.addSource("visitors", {
        type: "geojson",
        data: buildGeoJson(markers) as any,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: "heatmap",
        type: "heatmap",
        source: "visitors",
        layout: { visibility: "none" },
        paint: getHeatmapPaint(mapStyle),
      } as any);

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "visitors",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#22c55e",
            5,
            "#f59e0b",
            15,
            "#ef4444",
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "point_count"],
            2,
            20,
            10,
            28,
            50,
            40,
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
          "circle-opacity": 0.95,
        },
      } as any);

      // No cluster-count symbol layer - we use HTML labels instead

      // Cluster interactions
      map.on("click", "clusters", (e: MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const feature = features?.[0];
        if (!feature) return;

        const clusterId = (feature.properties as any)?.cluster_id;
        if (clusterId === undefined) return;

        const source = map.getSource("visitors") as GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoomLevel) => {
          const coords = (feature.geometry as any)?.coordinates as [number, number] | undefined;
          if (!coords) return;
          map.easeTo({ center: coords, zoom: zoomLevel, duration: 500 });
        }).catch(() => {
          // ignore
        });
      });

      map.on("mousemove", "clusters", (e: MapMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })?.[0];
        if (!feature) return;

        const coords = (feature.geometry as any)?.coordinates as [number, number] | undefined;
        const pointCount = (feature.properties as any)?.point_count ?? 0;
        if (!coords) return;

        if (!hoverPopupRef.current) {
          hoverPopupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 25,
          });
        }

        hoverPopupRef.current
          .setLngLat(coords)
          .setHTML(
            `<div class="p-2 text-center font-sans">
              <div class="text-lg font-bold">${pointCount}</div>
              <div class="text-xs opacity-70">locations</div>
              <div class="text-2xs mt-1 opacity-50">Click to expand</div>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "grab";
        hoverPopupRef.current?.remove();
      });

      // Update cluster labels after initial render
      map.once("idle", () => {
        updateClusterLabels();
      });
    });

    // Update cluster labels on map movement
    map.on("move", updateClusterLabels);
    map.on("zoom", updateClusterLabels);

    return () => {
      try {
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
      } catch {
        // no-op
      }

      clusterLabelsRef.current.forEach((el) => el.remove());
      clusterLabelsRef.current = [];

      markersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {
          // no-op
        }
      });
      markersRef.current = [];

      try {
        map.remove();
      } catch {
        // no-op
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply style changes (MapLibre requires setStyle)
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Preserve current view when switching styles
    const current = map.getCenter();
    const currentZoom = map.getZoom();

    map.setStyle(mapStyle);

    map.once("styledata", () => {
      // Re-add data source/layers when style changes
      // (Style switch wipes custom sources/layers)
      if (!map.getSource("visitors")) {
        map.addSource("visitors", {
          type: "geojson",
          data: buildGeoJson(markers) as any,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
      }

      const ensureLayer = (id: string, def: any) => {
        if (map.getLayer(id)) return;
        map.addLayer(def);
      };

      ensureLayer(
        "heatmap",
        {
          id: "heatmap",
          type: "heatmap",
          source: "visitors",
          layout: { visibility: showHeatmap ? "visible" : "none" },
          paint: getHeatmapPaint(mapStyle),
        } as any
      );

      ensureLayer(
        "clusters",
        {
          id: "clusters",
          type: "circle",
          source: "visitors",
          filter: ["has", "point_count"],
          layout: { visibility: showHeatmap ? "none" : "visible" },
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#22c55e",
              5,
              "#f59e0b",
              15,
              "#ef4444",
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              20,
              10,
              28,
              50,
              40,
            ],
            "circle-stroke-width": 3,
            "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
            "circle-opacity": 0.95,
          },
        } as any
      );

      // No cluster-count symbol layer - we use HTML labels instead

      map.jumpTo({ center: [current.lng, current.lat], zoom: currentZoom });

      // Cluster handlers need to be re-bound after style switch (layer objects replaced)
      const hasClick = (map as any)._listeners?.click?.some((l: any) => l?.layerId === "clusters");
      void hasClick; // best-effort; maplibre doesn't expose clean layer-listeners API

      // Update HTML cluster labels after style switch
      map.once("idle", updateClusterLabels);
    });
  }, [mapStyle, markers, showHeatmap, updateClusterLabels]);

  // Update source data when markers change
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("visitors") as GeoJSONSource | undefined;
    if (source) {
      source.setData(buildGeoJson(markers) as any);
    }
  }, [markers]);

  // Add/remove custom HTML markers (only when heatmap is off)
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // clear existing
    markersRef.current.forEach((m) => {
      try {
        m.remove();
      } catch {
        // no-op
      }
    });
    markersRef.current = [];

    if (showHeatmap) return;

    markersRef.current = markers.map((m) => {
      const size = getMarkerSize(m.count, maxCount);
      const fillColor = getMarkerFillColor(m.count, maxCount);

      const el = document.createElement("div");
      el.className = cn(
        "relative",
        onMarkerClick ? "cursor-pointer" : "cursor-default",
        "transition-all duration-300 ease-out",
        onMarkerClick ? "hover:scale-110 hover:-translate-y-1" : "",
        "animate-fade-in"
      );

      el.innerHTML = `
        <div class="relative" style="width:${size}px;height:${size}px">
          ${createPinSVG(fillColor, size)}
          <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;margin-top:-6px;pointer-events:none;color:white;font-size:10px;font-weight:700;">
            ${m.count > 99 ? "99+" : m.count}
          </span>
        </div>
      `;

      el.addEventListener("mouseenter", () => {
        if (!hoverPopupRef.current) {
          hoverPopupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 25 });
        }

        const flag = m.countryCode && m.countryCode.length === 2 ? countryCodeToFlag(m.countryCode) : "";
        hoverPopupRef.current
          .setLngLat([m.lng, m.lat])
          .setHTML(
            `<div class="p-2 font-sans">
              <div class="flex items-center gap-2 mb-1">
                ${flag ? `<span class="text-xl">${flag}</span>` : ""}
                <div>
                  <div class="font-semibold text-sm">${m.country}</div>
                  ${m.city ? `<div class="text-xs opacity-70">${m.city}</div>` : ""}
                </div>
              </div>
              <div class="text-sm font-medium">
                <span class="text-lg font-bold">${m.count}</span> visitor${m.count !== 1 ? "s" : ""}
              </div>
            </div>`
          )
          .addTo(map);
      });

      el.addEventListener("mouseleave", () => {
        hoverPopupRef.current?.remove();
      });

      if (onMarkerClick) {
        el.addEventListener("click", () => onMarkerClick(m));
      }

      return new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
    });
  }, [markers, maxCount, onMarkerClick, showHeatmap]);

  // Toggle layer visibility when heatmap changes
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const setVis = (layerId: string, visible: boolean) => {
      if (!map.getLayer(layerId)) return;
      map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    };

    setVis("heatmap", showHeatmap);
    setVis("clusters", !showHeatmap);

    // Update cluster labels when heatmap toggle changes
    updateClusterLabels();
  }, [showHeatmap, updateClusterLabels]);

  return (
    <div className={cn("relative overflow-hidden", className)} style={style}>
      <div ref={containerRef} className="h-full w-full" />

      {showControls && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-background/90 backdrop-blur-sm border-border shadow-md gap-1"
              >
                {MAP_STYLE_OPTIONS[selectedStyleKey].label}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(MAP_STYLE_OPTIONS) as MapStyleKey[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSelectedStyleKey(key)}
                  className={cn(selectedStyleKey === key && "bg-accent")}
                >
                  {MAP_STYLE_OPTIONS[key].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 shadow-md">
            <LayersThree01 size={14} className={cn(showHeatmap && "text-orange-500")} />
            <Label htmlFor="heatmap-toggle" className="text-xs font-medium cursor-pointer">
              Heatmap
            </Label>
            <Switch
              id="heatmap-toggle"
              checked={showHeatmap}
              onCheckedChange={setShowHeatmap}
              className="scale-75"
            />
          </div>
        </div>
      )}

      {showControls && (
        <button
          onClick={resetView}
          className="absolute bottom-4 right-4 p-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-md hover:bg-muted transition-colors z-10"
          title="Reset view"
        >
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
              <div className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: createPinSVG("#22c55e", 14) }} />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: createPinSVG("#f59e0b", 14) }} />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: createPinSVG("#ef4444", 14) }} />
                <span>High</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function computeBounds(
  coordinates: Array<{ lng: number; lat: number }>
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;

  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;

  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
  }

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
