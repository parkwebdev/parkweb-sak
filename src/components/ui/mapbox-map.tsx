"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "@/components/ThemeProvider";
import { Maximize02, Minimize02, RefreshCcw01 } from "@untitledui/icons";

// Mapbox vector styles - beautiful, colorful maps
const MAPBOX_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
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
  onLoad?: (map: mapboxgl.Map) => void;
  fitBounds?: [[number, number], [number, number]];
  fitBoundsPadding?: number;
  showControls?: boolean;
}

// Country code to flag emoji helper
function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

// Get color based on visitor count percentage
function getMarkerColor(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio >= 0.6) return "#ef4444"; // Red - high
  if (ratio >= 0.3) return "#f59e0b"; // Amber - medium
  return "#22c55e"; // Green - low
}

export function MapboxMap({
  className,
  style,
  accessToken,
  center = [0, 20],
  zoom = 1.5,
  markers = [],
  onLoad,
  fitBounds,
  fitBoundsPadding = 50,
  showControls = true,
}: MapboxMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const popupRef = React.useRef<mapboxgl.Popup | null>(null);
  const { theme: currentTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [currentStyle, setCurrentStyle] = React.useState<keyof typeof MAPBOX_STYLES>("light");
  const initialBoundsRef = React.useRef<[[number, number], [number, number]] | null>(null);

  // Resolve theme
  React.useEffect(() => {
    setMounted(true);
    if (currentTheme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => {
        const isDark = mql.matches;
        setResolvedTheme(isDark ? "dark" : "light");
        setCurrentStyle(isDark ? "dark" : "light");
      };
      apply();
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
    const isDark = currentTheme === "dark";
    setResolvedTheme(isDark ? "dark" : "light");
    setCurrentStyle(isDark ? "dark" : "light");
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

  // Initialize map
  React.useEffect(() => {
    if (!mounted || !containerRef.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLES[currentStyle],
      center: center,
      zoom: zoom,
      projection: "mercator",
      attributionControl: true,
    });

    // Add navigation control
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

    // Create popup instance
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      className: "visitor-map-popup",
    });

    map.on("load", () => {
      // Add GeoJSON source with clustering
      map.addSource("visitors", {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles layer
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "visitors",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#22c55e", // Green for small clusters
            5,
            "#f59e0b", // Amber for medium
            15,
            "#ef4444", // Red for large
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            5,
            24,
            15,
            32,
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(255, 255, 255, 0.8)",
          "circle-opacity": 0.9,
        },
      });

      // Cluster count labels
      map.addLayer({
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
      });

      // Individual unclustered points
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "visitors",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "count"],
            1,
            10,
            50,
            22,
            200,
            30,
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
          "circle-opacity": 0.85,
        },
      });

      // Add visitor count label inside circles
      map.addLayer({
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
      });

      // Click on cluster to zoom
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource("visitors") as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoomLevel) => {
          if (err) return;
          const geometry = features[0].geometry;
          if (geometry.type === "Point") {
            map.easeTo({
              center: geometry.coordinates as [number, number],
              zoom: zoomLevel,
            });
          }
        });
      });

      // Hover on unclustered point - show popup
      map.on("mouseenter", "unclustered-point", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const features = e.features;
        if (!features?.length) return;

        const props = features[0].properties;
        const geometry = features[0].geometry;
        if (geometry.type !== "Point") return;

        const flag = countryCodeToFlag(props?.countryCode || "");
        const country = props?.country || "Unknown";
        const city = props?.city || "";
        const count = props?.count || 0;

        const html = `
          <div style="padding: 8px 12px; font-family: system-ui, sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 20px;">${flag}</span>
              <div>
                <div style="font-weight: 600; font-size: 14px; color: inherit;">${country}</div>
                ${city ? `<div style="font-size: 12px; opacity: 0.7;">${city}</div>` : ""}
              </div>
            </div>
            <div style="font-size: 13px; font-weight: 500; color: inherit;">
              <span style="font-size: 18px; font-weight: 700;">${count}</span> visitor${count !== 1 ? "s" : ""}
            </div>
          </div>
        `;

        popupRef.current
          ?.setLngLat(geometry.coordinates as [number, number])
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });

      // Hover on cluster
      map.on("mouseenter", "clusters", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const features = e.features;
        if (!features?.length) return;

        const geometry = features[0].geometry;
        if (geometry.type !== "Point") return;

        const pointCount = features[0].properties?.point_count || 0;
        const html = `
          <div style="padding: 8px 12px; font-family: system-ui, sans-serif; text-align: center;">
            <div style="font-size: 18px; font-weight: 700;">${pointCount}</div>
            <div style="font-size: 12px; opacity: 0.7;">locations</div>
            <div style="font-size: 11px; margin-top: 4px; opacity: 0.5;">Click to expand</div>
          </div>
        `;

        popupRef.current
          ?.setLngLat(geometry.coordinates as [number, number])
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });

      // Fit bounds if provided
      if (fitBounds) {
        map.fitBounds(fitBounds, {
          padding: fitBoundsPadding,
          maxZoom: 6,
        });
      }

      onLoad?.(map);
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [mounted, accessToken]);

  // Update style when theme changes
  React.useEffect(() => {
    if (mapRef.current && mounted) {
      mapRef.current.setStyle(MAPBOX_STYLES[currentStyle]);

      // Re-add data source after style change
      mapRef.current.once("style.load", () => {
        const map = mapRef.current;
        if (!map) return;

        // Re-add source
        if (!map.getSource("visitors")) {
          map.addSource("visitors", {
            type: "geojson",
            data: geojsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });
        }

        // Re-add layers
        if (!map.getLayer("clusters")) {
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
              "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 32],
              "circle-stroke-width": 3,
              "circle-stroke-color": "rgba(255, 255, 255, 0.8)",
              "circle-opacity": 0.9,
            },
          });
        }

        if (!map.getLayer("cluster-count")) {
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "visitors",
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 14,
            },
            paint: { "text-color": "#ffffff" },
          });
        }

        if (!map.getLayer("unclustered-point")) {
          map.addLayer({
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
          });
        }

        if (!map.getLayer("unclustered-count")) {
          map.addLayer({
            id: "unclustered-count",
            type: "symbol",
            source: "visitors",
            filter: ["!", ["has", "point_count"]],
            layout: {
              "text-field": ["get", "count"],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
            paint: { "text-color": "#ffffff" },
          });
        }
      });
    }
  }, [currentStyle, mounted, geojsonData]);

  // Update GeoJSON data when markers change
  React.useEffect(() => {
    if (!mapRef.current || !mounted) return;
    const source = mapRef.current.getSource("visitors") as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojsonData);
    }
  }, [geojsonData, mounted]);

  // Fit bounds when they change
  React.useEffect(() => {
    if (mapRef.current && fitBounds && mounted) {
      mapRef.current.fitBounds(fitBounds, {
        padding: fitBoundsPadding,
        maxZoom: 6,
      });
    }
  }, [fitBounds, fitBoundsPadding, mounted]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;

    if (!isFullscreen) {
      parent.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Resize map after fullscreen change
      setTimeout(() => mapRef.current?.resize(), 100);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Reset view
  const resetView = () => {
    if (!mapRef.current) return;
    if (initialBoundsRef.current) {
      mapRef.current.fitBounds(initialBoundsRef.current, {
        padding: fitBoundsPadding,
        maxZoom: 6,
      });
    } else {
      mapRef.current.flyTo({ center, zoom });
    }
  };

  if (!mounted) {
    return (
      <div className={className} style={{ ...style, background: "hsl(var(--muted))" }} />
    );
  }

  return (
    <div className="relative h-full w-full" style={style}>
      <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />

      {/* Custom controls */}
      {showControls && (
        <div className="absolute bottom-3 left-3 flex gap-2">
          {/* Reset view button */}
          <button
            onClick={resetView}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Reset view"
          >
            <RefreshCcw01 size={16} />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize02 size={16} /> : <Maximize02 size={16} />}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 rounded-md bg-background/90 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
        <div className="mb-1 font-medium text-foreground">Visitors</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
            <span className="text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
            <span className="text-muted-foreground">Med</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
            <span className="text-muted-foreground">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility to compute bounds from coordinates
export function computeBounds(
  coordinates: Array<{ lng: number; lat: number }>
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  coordinates.forEach(({ lng, lat }) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

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
