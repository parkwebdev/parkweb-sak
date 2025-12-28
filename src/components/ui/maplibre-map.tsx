/* MapLibre GL Map Component - Free unlimited maps with CARTO basemaps */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import maplibregl, { Map as MapLibreInstance, MapMouseEvent, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useTheme } from "@/components/ThemeProvider";
import { RefreshCcw01, LayersThree01 } from "@untitledui/icons";
import { logger } from "@/utils/logger";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// CARTO basemap URLs - Positron for light, Dark Matter for dark
const POSITRON_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_MATTER_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

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

function getMarkerSize(count: number, maxCount: number, zoom: number = 2): number {
  const ratio = count / maxCount;
  
  // Base size from visitor count
  let baseSize = 20;
  if (ratio >= 0.6) baseSize = 32;
  else if (ratio >= 0.3) baseSize = 26;
  
  // Scale up based on zoom (zoom 1-22)
  // At zoom < 4: use base size
  // At zoom 4-8: gradual increase
  // At zoom 8+: larger pins
  const zoomScale = zoom < 4 ? 1 : zoom < 8 ? 1 + (zoom - 4) * 0.15 : 1.6 + (zoom - 8) * 0.1;
  
  return Math.round(baseSize * Math.min(zoomScale, 2.5)); // Cap at 2.5x
}

function getMarkerFillColor(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio >= 0.6) return "#ef4444";
  if (ratio >= 0.3) return "#f59e0b";
  return "#22c55e";
}

function createCircleSVG(fillColor: string, size: number): string {
  // Simple circle marker with subtle shadow
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="${fillColor}" stroke="white" stroke-width="2"/>
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
  const hoverPopupRef = React.useRef<maplibregl.Popup | null>(null);
  const initialBoundsRef = React.useRef(fitBounds);

  const { theme: currentTheme } = useTheme();
  const [mapStyle, setMapStyle] = React.useState(POSITRON_STYLE);
  const [showHeatmap, setShowHeatmap] = React.useState(false);
  const [currentZoom, setCurrentZoom] = React.useState(zoom);
  const initializedStyleRef = React.useRef<string | null>(null);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (fitBounds) initialBoundsRef.current = fitBounds;
  }, [fitBounds]);

  // Auto-switch map style based on theme: Positron for light, Dark Matter for dark
  React.useEffect(() => {
    const resolveStyle = () => {
      if (currentTheme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? DARK_MATTER_STYLE
          : POSITRON_STYLE;
      }
      return currentTheme === "dark" ? DARK_MATTER_STYLE : POSITRON_STYLE;
    };

    setMapStyle(resolveStyle());

    if (currentTheme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setMapStyle(mql.matches ? DARK_MATTER_STYLE : POSITRON_STYLE);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [currentTheme]);

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

  // No cluster labels - we only use HTML markers

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

      // Native clusters layer - hidden, we use HTML markers only
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "visitors",
        filter: ["has", "point_count"],
        layout: { visibility: "none" }, // Hidden - HTML markers handle rendering
        paint: {
          "circle-radius": 0,
          "circle-opacity": 0,
        },
      } as any);

      // No cluster-count symbol layer - we use HTML labels instead

      // Ensure correct layer visibility after initial load
      map.once("idle", () => {
        if (map.getLayer("heatmap")) {
          map.setLayoutProperty("heatmap", "visibility", showHeatmap ? "visible" : "none");
        }
      });

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
          // Use flyTo for smoother animation with arc trajectory
          map.flyTo({
            center: coords,
            zoom: zoomLevel,
            duration: 800,
            essential: true,
            curve: 1.42,
            speed: 1.2,
          });
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
            `<div style="padding: 8px; text-align: center; font-family: system-ui, sans-serif; color: #1f2937; background: white; border-radius: 6px;">
              <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${pointCount}</div>
              <div style="font-size: 12px; color: #6b7280;">locations</div>
              <div style="font-size: 10px; margin-top: 4px; color: #9ca3af;">Click to expand</div>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "grab";
        hoverPopupRef.current?.remove();
      });

    });
    
    // Track zoom level changes with smooth marker size updates
    map.on("zoom", () => {
      const newZoom = Math.round(map.getZoom() * 10) / 10;
      setCurrentZoom(newZoom);
      
      // Update marker sizes in-place for smooth transitions
      markersRef.current.forEach((marker, index) => {
        const m = markers[index];
        if (!m) return;
        
        const size = getMarkerSize(m.count, maxCount, newZoom);
        const fontSize = Math.max(9, size * 0.35);
        const el = marker.getElement();
        const innerDiv = el.querySelector('.marker-inner') as HTMLElement;
        const svg = innerDiv?.querySelector('svg');
        const textSpan = innerDiv?.querySelector('span') as HTMLElement;
        
        if (innerDiv) {
          innerDiv.style.width = `${size}px`;
          innerDiv.style.height = `${size}px`;
        }
        if (svg) {
          svg.setAttribute('width', `${size}`);
          svg.setAttribute('height', `${size}`);
        }
        if (textSpan) {
          textSpan.style.fontSize = `${fontSize}px`;
        }
      });
    });
    
    // Add dissolve effect during zoom transitions
    map.on("zoomstart", () => {
      markersRef.current.forEach((marker) => {
        const el = marker.getElement();
        el.style.opacity = "0.7";
      });
    });
    
    map.on("zoomend", () => {
      markersRef.current.forEach((marker) => {
        const el = marker.getElement();
        el.style.opacity = "1";
      });
    });

    return () => {
      try {
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
      } catch {
        // no-op
      }


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

    // Skip setStyle on first render - map was created with this style
    if (initializedStyleRef.current === null) {
      initializedStyleRef.current = mapStyle;
      return;
    }

    // Only call setStyle if style actually changed
    if (initializedStyleRef.current === mapStyle) return;
    initializedStyleRef.current = mapStyle;

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

      // Native clusters layer - hidden, we use HTML markers only
      ensureLayer(
        "clusters",
        {
          id: "clusters",
          type: "circle",
          source: "visitors",
          filter: ["has", "point_count"],
          layout: { visibility: "none" }, // Hidden - HTML markers handle rendering
          paint: {
            "circle-radius": 0,
            "circle-opacity": 0,
          },
        } as any
      );

      // No cluster-count symbol layer - we use HTML labels instead

      map.jumpTo({ center: [current.lng, current.lat], zoom: currentZoom });

      // Cluster handlers need to be re-bound after style switch (layer objects replaced)
      const hasClick = (map as any)._listeners?.click?.some((l: any) => l?.layerId === "clusters");
      void hasClick; // best-effort; maplibre doesn't expose clean layer-listeners API

    });
  }, [mapStyle, markers, showHeatmap]);

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

    markersRef.current = markers.map((m, index) => {
      const size = getMarkerSize(m.count, maxCount, currentZoom);
      const fillColor = getMarkerFillColor(m.count, maxCount);

      const el = document.createElement("div");
      // Keep root element simple - NO transforms or animations here
      // MapLibre controls this element's transform for positioning
      el.className = cn(
        "relative",
        onMarkerClick ? "cursor-pointer" : "cursor-default",
      );
      
      const fontSize = Math.max(9, size * 0.4);
      const animationDelay = index * 0.05;
      
      // All animations and transforms go on .marker-inner, NOT the root el
      el.innerHTML = `
        <div class="marker-inner" style="
          width:${size}px;
          height:${size}px;
          position:relative;
          border-radius:50%;
          opacity:0;
          animation: marker-bounce-in 0.5s ease-out ${animationDelay}s both;
          transition: transform 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out;
        ">
          <!-- Pulse ring (hidden by default, shown on hover) -->
          <div class="pulse-ring" style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid ${fillColor};
            opacity: 0;
            pointer-events: none;
          "></div>
          ${createCircleSVG(fillColor, size)}
          <span style="position:absolute;top:0;left:0;right:0;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;color:white;font-size:${fontSize}px;font-weight:700;transition:font-size 0.2s ease-out;">
            ${m.count > 99 ? "99+" : m.count}
          </span>
        </div>
      `;

      el.addEventListener("mouseenter", () => {
        // Scale up inner element (NOT root el - that would break MapLibre positioning)
        const inner = el.querySelector('.marker-inner') as HTMLElement;
        if (inner && onMarkerClick) {
          inner.style.transform = "scale(1.1)";
        }
        
        // Trigger pulse animation
        const pulseRing = el.querySelector('.pulse-ring') as HTMLElement;
        if (pulseRing) {
          pulseRing.style.animation = "marker-pulse 1s ease-out infinite";
          pulseRing.style.opacity = "0.8";
        }
        
        if (!hoverPopupRef.current) {
          hoverPopupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 25 });
        }

        const flag = m.countryCode && m.countryCode.length === 2 ? countryCodeToFlag(m.countryCode) : "";
        hoverPopupRef.current
          .setLngLat([m.lng, m.lat])
          .setHTML(
            `<div style="padding: 8px; font-family: system-ui, sans-serif; color: #1f2937; background: white; border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                ${flag ? `<span style="font-size: 20px;">${flag}</span>` : ""}
                <div>
                  <div style="font-weight: 600; font-size: 14px; color: #1f2937;">${m.country}</div>
                  ${m.city ? `<div style="font-size: 12px; color: #6b7280;">${m.city}</div>` : ""}
                </div>
              </div>
              <div style="font-size: 14px; font-weight: 500; color: #374151;">
                <span style="font-size: 18px; font-weight: 700;">${m.count}</span> visitor${m.count !== 1 ? "s" : ""}
              </div>
            </div>`
          )
          .addTo(map);
      });

      el.addEventListener("mouseleave", () => {
        // Reset scale on inner element
        const inner = el.querySelector('.marker-inner') as HTMLElement;
        if (inner) {
          inner.style.transform = "scale(1)";
        }
        
        // Stop pulse animation
        const pulseRing = el.querySelector('.pulse-ring') as HTMLElement;
        if (pulseRing) {
          pulseRing.style.animation = "none";
          pulseRing.style.opacity = "0";
        }
        
        hoverPopupRef.current?.remove();
      });

      // Click to zoom + trigger callback
      el.addEventListener("click", () => {
        // Zoom to the marker location
        map.flyTo({
          center: [m.lng, m.lat],
          zoom: Math.max(map.getZoom(), 8), // Zoom to at least level 8
          duration: 800,
        });
        
        // Also call the external handler if provided
        if (onMarkerClick) onMarkerClick(m);
      });

      return new maplibregl.Marker({ element: el, anchor: "center" })
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
  }, [showHeatmap]);

  // Keyboard navigation for markers
  React.useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map || !markers.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setSelectedMarkerIndex((prev) =>
            prev === null ? 0 : (prev + 1) % markers.length
          );
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setSelectedMarkerIndex((prev) =>
            prev === null ? markers.length - 1 : (prev - 1 + markers.length) % markers.length
          );
          break;
        case "Enter":
          if (selectedMarkerIndex !== null && markers[selectedMarkerIndex]) {
            const m = markers[selectedMarkerIndex];
            map.flyTo({ center: [m.lng, m.lat], zoom: 8, duration: 800 });
            onMarkerClick?.(m);
          }
          break;
        case "Escape":
          setSelectedMarkerIndex(null);
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [markers, selectedMarkerIndex, onMarkerClick]);

  // Visual focus ring for selected marker via keyboard
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker, index) => {
      const el = marker.getElement();
      const innerDiv = el.querySelector(".marker-inner") as HTMLElement;
      if (!innerDiv) return;

      if (index === selectedMarkerIndex) {
        innerDiv.style.outline = "2px solid white";
        innerDiv.style.outlineOffset = "2px";
        innerDiv.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.5)";

        // Pan map to selected marker
        const m = markers[index];
        if (m) map.panTo([m.lng, m.lat], { duration: 300 });
      } else {
        innerDiv.style.outline = "none";
        innerDiv.style.outlineOffset = "0";
        innerDiv.style.boxShadow = "none";
      }
    });
  }, [selectedMarkerIndex, markers]);

  return (
    <div
      className={cn("relative overflow-hidden focus:outline-none", className)}
      style={style}
      tabIndex={0}
      role="application"
      aria-label="Interactive map with markers. Use arrow keys to navigate markers, Enter to select."
    >
      <div ref={containerRef} className="h-full w-full" />

      {showControls && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 shadow-md">
          <LayersThree01 size={12} className={cn(showHeatmap && "text-orange-500")} />
          <Label htmlFor="heatmap-toggle" className="text-2xs font-medium cursor-pointer">
            Heatmap
          </Label>
          <Switch
            id="heatmap-toggle"
            checked={showHeatmap}
            onCheckedChange={setShowHeatmap}
            className="scale-[0.6] origin-left"
          />
        </div>
      )}

      {showControls && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 shadow-md">
            <span className="text-2xs font-medium text-muted-foreground">
              {currentZoom.toFixed(1)}×
            </span>
          </div>
          <button
            onClick={resetView}
            className="p-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-md hover:bg-muted transition-colors"
            title="Reset view"
          >
            <RefreshCcw01 size={16} />
          </button>
        </div>
      )}

      {showControls && markers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs z-10">
          <div className="font-medium mb-2">{showHeatmap ? "Density intensity" : "Visitor density"}</div>
          {showHeatmap ? (
            <div className="flex items-center gap-1">
              <div 
                className="w-24 h-3 rounded-sm" 
                style={{
                  background: mapStyle.includes("dark-matter")
                    ? "linear-gradient(to right, rgb(0, 255, 255), rgb(0, 255, 128), rgb(255, 255, 0), rgb(255, 165, 0), rgb(255, 69, 0), rgb(255, 0, 64))"
                    : "linear-gradient(to right, rgb(65, 182, 196), rgb(127, 205, 187), rgb(199, 233, 180), rgb(254, 178, 76), rgb(240, 59, 32), rgb(189, 0, 38))"
                }}
              />
              <span className="text-2xs ml-1">Low → High</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: createCircleSVG("#22c55e", 14) }} />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: createCircleSVG("#f59e0b", 14) }} />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: createCircleSVG("#ef4444", 14) }} />
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
