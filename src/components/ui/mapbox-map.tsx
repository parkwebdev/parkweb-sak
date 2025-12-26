"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "@/components/ThemeProvider";

// Raster tile styles (no Mapbox-hosted tiles, so they render even with strict token restrictions)
const RASTER_STYLES: Record<"light" | "dark", mapboxgl.Style> = {
  light: {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  },
  dark: {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  },
};

interface MapboxMapProps {
  className?: string;
  style?: React.CSSProperties;
  accessToken: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: Array<{
    id: string;
    lng: number;
    lat: number;
    radius: number;
    color: string;
    popupContent?: React.ReactNode;
    label?: string;
  }>;
  onLoad?: (map: mapboxgl.Map) => void;
  fitBounds?: [[number, number], [number, number]]; // [[sw_lng, sw_lat], [ne_lng, ne_lat]]
  fitBoundsPadding?: number;
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
}: MapboxMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markersRef = React.useRef<mapboxgl.Marker[]>([]);
  const { theme: currentTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  // Resolve theme (handle system preference)
  React.useEffect(() => {
    setMounted(true);
    
    if (currentTheme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => setResolvedTheme(mql.matches ? "dark" : "light");
      apply();
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
    
    setResolvedTheme(currentTheme === "dark" ? "dark" : "light");
  }, [currentTheme]);

  // Initialize map
  React.useEffect(() => {
    if (!mounted || !containerRef.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: RASTER_STYLES[resolvedTheme],
      center: center,
      zoom: zoom,
      projection: "mercator",
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");
    map.scrollZoom.disable();

    map.on("error", (e) => {
      console.error("[MapboxMap] map error", e?.error || e);
      // Check if this is a tile loading error
      const errorMessage = e?.error?.message || "";
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        console.warn("[MapboxMap] Tile loading blocked - likely CSP issue");
      }
    });

    map.on("load", () => {
      onLoad?.(map);
      
      // Fit bounds if provided
      if (fitBounds) {
        map.fitBounds(fitBounds, {
          padding: fitBoundsPadding,
          maxZoom: 5,
        });
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [mounted, accessToken, resolvedTheme]);

  // Update style when theme changes
  React.useEffect(() => {
    if (mapRef.current && mounted) {
      mapRef.current.setStyle(RASTER_STYLES[resolvedTheme]);
    }
  }, [resolvedTheme, mounted]);

  // Update markers
  React.useEffect(() => {
    if (!mapRef.current || !mounted) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((marker) => {
      // Create a custom circle element
      const el = document.createElement("div");
      el.className = "mapbox-circle-marker";
      el.style.width = `${marker.radius * 2}px`;
      el.style.height = `${marker.radius * 2}px`;
      el.style.borderRadius = "50%";
      el.style.backgroundColor = marker.color;
      el.style.opacity = "0.6";
      el.style.border = `2px solid ${marker.color}`;
      el.style.cursor = "pointer";
      el.style.transition = "transform 0.2s ease, opacity 0.2s ease";

      // Hover effects
      el.addEventListener("mouseenter", () => {
        el.style.opacity = "0.9";
        el.style.transform = "scale(1.1)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.opacity = "0.6";
        el.style.transform = "scale(1)";
      });

      const mapboxMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current!);

      // Add popup if content provided
      if (marker.popupContent) {
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: marker.radius + 5,
        });

        // Create popup content
        const popupDiv = document.createElement("div");
        popupDiv.innerHTML = typeof marker.popupContent === "string" 
          ? marker.popupContent 
          : "";
        
        if (marker.label) {
          popupDiv.innerHTML = marker.label;
        }

        popup.setDOMContent(popupDiv);

        el.addEventListener("mouseenter", () => {
          popup.setLngLat([marker.lng, marker.lat]).addTo(mapRef.current!);
        });
        el.addEventListener("mouseleave", () => {
          popup.remove();
        });
      }

      markersRef.current.push(mapboxMarker);
    });
  }, [markers, mounted]);

  // Fit bounds when they change
  React.useEffect(() => {
    if (mapRef.current && fitBounds && mounted) {
      mapRef.current.fitBounds(fitBounds, {
        padding: fitBoundsPadding,
        maxZoom: 5,
      });
    }
  }, [fitBounds, fitBoundsPadding, mounted]);

  if (!mounted) {
    return (
      <div
        className={className}
        style={{ ...style, background: "hsl(var(--muted))" }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...style }}
    />
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

  // Add some padding if there's only one point
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
