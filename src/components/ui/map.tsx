"use client";

import * as React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  CircleMarker,
  useMap,
} from "react-leaflet";
import { useTheme } from "@/components/ThemeProvider";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Theme-aware tile layer URLs
const TILE_LAYERS = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
} as const;

const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Context for map theme
const MapThemeContext = React.createContext<"light" | "dark">("light");

interface MapProps extends React.ComponentProps<typeof MapContainer> {
  children?: React.ReactNode;
}

const Map = React.forwardRef<L.Map, MapProps>(
  ({ children, className, ...props }, ref) => {
    const { theme: currentTheme } = useTheme();

    const [mounted, setMounted] = React.useState(false);
    const [theme, setTheme] = React.useState<"light" | "dark">("light");

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (currentTheme === "system") {
        const mql: MediaQueryList = window.matchMedia(
          "(prefers-color-scheme: dark)"
        );
        const apply = () => setTheme(mql.matches ? "dark" : "light");
        apply();

        // Safari (<=13) uses addListener/removeListener
        if (typeof mql.addEventListener === "function") {
          mql.addEventListener("change", apply);
          return () => mql.removeEventListener("change", apply);
        }

        (mql as unknown as { addListener: (cb: () => void) => void }).addListener(apply);
        return () =>
          (mql as unknown as { removeListener: (cb: () => void) => void }).removeListener(apply);
      }

      setTheme(currentTheme === "dark" ? "dark" : "light");
      return;
    }, [currentTheme]);

    // Prevent react-leaflet from initializing before the client is mounted.
    if (!mounted) {
      return <div className={className} style={props.style} />;
    }

    return (
      <MapThemeContext.Provider value={theme}>
        <MapContainer ref={ref} className={className} {...props}>
          {children}
        </MapContainer>
      </MapThemeContext.Provider>
    );
  }
);
Map.displayName = "Map";

// Auto tile layer that follows theme
const MapTileLayer = React.forwardRef<
  L.TileLayer,
  Omit<React.ComponentProps<typeof TileLayer>, "url">
>((props, ref) => {
  const theme = React.useContext(MapThemeContext);
  
  return (
    <TileLayer
      ref={ref}
      url={TILE_LAYERS[theme]}
      attribution={TILE_ATTRIBUTION}
      {...props}
    />
  );
});
MapTileLayer.displayName = "MapTileLayer";

// Re-export components with consistent naming
const MapMarker = Marker;
const MapPopup = Popup;
const MapTooltip = Tooltip;
const MapCircleMarker = CircleMarker;

// Hook to access map instance
const useMapInstance = useMap;

// Bounds fitter component
interface FitBoundsProps {
  bounds: L.LatLngBoundsExpression;
  options?: L.FitBoundsOptions;
}

const MapFitBounds: React.FC<FitBoundsProps> = ({ bounds, options }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], ...options });
    }
  }, [map, bounds, options]);
  
  return null;
};

export {
  Map,
  MapTileLayer,
  MapMarker,
  MapPopup,
  MapTooltip,
  MapCircleMarker,
  MapFitBounds,
  useMapInstance,
  TILE_LAYERS,
};
