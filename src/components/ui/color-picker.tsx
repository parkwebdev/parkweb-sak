/**
 * Color Picker Component
 * 
 * A comprehensive color picker with selection area, hue slider,
 * alpha slider, multiple color modes (HEX/RGB/HSL), and eyedropper.
 * 
 * @module components/ui/color-picker
 * 
 * @example
 * ```tsx
 * <ColorPicker value="#3B82F6" onChange={setColor} showAlpha />
 * ```
 */
"use client";

import * as React from "react";
import Color from "color";
import { Dropper } from "@untitledui/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Type alias for Color instance
type ColorInstance = InstanceType<typeof Color>;

type ColorMode = "hex" | "rgb" | "hsl";

// Color Picker Context
interface ColorPickerContextValue {
  color: ColorInstance;
  alpha: number;
  setColor: (color: ColorInstance) => void;
  setAlpha: (alpha: number) => void;
  showAlpha: boolean;
}

const ColorPickerContext = React.createContext<ColorPickerContextValue | null>(null);

function useColorPicker() {
  const context = React.useContext(ColorPickerContext);
  if (!context) {
    throw new Error("useColorPicker must be used within a ColorPickerProvider");
  }
  return context;
}

// Color Picker Selection Area
interface ColorPickerSelectionProps {
  className?: string;
}

function ColorPickerSelection({ className }: ColorPickerSelectionProps) {
  const { color, setColor } = useColorPicker();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const hue = color.hue();

  const updateColor = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const saturation = x * 100;
      const lightness = (1 - y) * 50 + (1 - x) * (1 - y) * 50;
      setColor(Color.hsl(hue, saturation, lightness));
    },
    [hue, setColor]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateColor(e.clientX, e.clientY);
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateColor(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, updateColor]);

  // Calculate thumb position
  const saturation = color.saturationl();
  const lightness = color.lightness();
  const thumbX = saturation / 100;
  const thumbY = 1 - lightness / 100 + (saturation / 100) * (lightness / 100 - 0.5);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-36 w-full cursor-crosshair rounded-md",
        className
      )}
      style={{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, transparent),
          hsl(${hue}, 100%, 50%)
        `,
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${thumbX * 100}%`,
          top: `${Math.max(0, Math.min(1, thumbY)) * 100}%`,
          backgroundColor: color.hex(),
        }}
      />
    </div>
  );
}

// Color Picker Hue Slider
interface ColorPickerHueProps {
  className?: string;
}

function ColorPickerHue({ className }: ColorPickerHueProps) {
  const { color, setColor } = useColorPicker();
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const updateHue = React.useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const hue = x * 360;
      setColor(Color.hsl(hue, color.saturationl(), color.lightness()));
    },
    [color, setColor]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateHue(e.clientX);
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateHue(e.clientX);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, updateHue]);

  const hue = color.hue();

  return (
    <div
      ref={sliderRef}
      className={cn(
        "relative h-3 w-full cursor-pointer rounded-full",
        className
      )}
      style={{
        background:
          "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
        }}
      />
    </div>
  );
}

// Alpha Slider
interface ColorPickerAlphaProps {
  className?: string;
}

function ColorPickerAlpha({ className }: ColorPickerAlphaProps) {
  const { color, alpha, setAlpha } = useColorPicker();
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const updateAlpha = React.useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setAlpha(Math.round(x * 100));
    },
    [setAlpha]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateAlpha(e.clientX);
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      updateAlpha(e.clientX);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, updateAlpha]);

  const colorHex = color.hex();

  return (
    <div
      ref={sliderRef}
      className={cn(
        "relative h-3 w-full cursor-pointer rounded-full",
        className
      )}
      style={{
        background: `
          linear-gradient(to right, transparent, ${colorHex}),
          repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px
        `,
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${alpha}%`,
          backgroundColor: colorHex,
        }}
      />
    </div>
  );
}

// Eye Dropper Button
interface ColorPickerEyeDropperProps {
  className?: string;
}

function ColorPickerEyeDropper({ className }: ColorPickerEyeDropperProps) {
  const { setColor } = useColorPicker();
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    setSupported("EyeDropper" in window);
  }, []);

  if (!supported) return null;

  const handleClick = async () => {
    try {
      // @ts-expect-error - EyeDropper API is not in TypeScript yet
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      setColor(Color(result.sRGBHex));
    } catch {
      // User cancelled or error
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("h-8 w-8 shrink-0 [&_svg]:!h-4 [&_svg]:!w-4", className)}
      onClick={handleClick}
      aria-label="Pick color from screen"
    >
      <Dropper className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

// Color Format Inputs with Mode Tabs
interface ColorPickerFormatProps {
  className?: string;
  mode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
}

function ColorPickerFormat({ className, mode, onModeChange }: ColorPickerFormatProps) {
  const { color, setColor, alpha, setAlpha, showAlpha } = useColorPicker();

  const rgb = color.rgb().object();
  const hsl = color.hsl().object();

  const handleRgbChange = (channel: "r" | "g" | "b", value: string) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...rgb, [channel]: num };
    setColor(Color.rgb(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (channel: "h" | "s" | "l", value: string) => {
    const max = channel === "h" ? 360 : 100;
    const num = Math.max(0, Math.min(max, parseInt(value) || 0));
    const newHsl = { ...hsl, [channel]: num };
    setColor(Color.hsl(newHsl.h, newHsl.s, newHsl.l));
  };

  const handleHexChange = (value: string) => {
    let hex = value;
    if (!hex.startsWith("#")) {
      hex = "#" + hex;
    }
    if (hex.length <= 7) {
      try {
        setColor(Color(hex));
      } catch {
        // Invalid hex
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Mode Tabs */}
      <div className="flex gap-1 border-b border-border pb-2">
        {(["hex", "rgb", "hsl"] as ColorMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-sm uppercase",
              mode === m
                ? "bg-muted text-foreground"
                : "text-muted-foreground"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Inputs based on mode */}
      {mode === "hex" && (
        <div className="flex items-center gap-2">
          <Input
            value={color.hex().toUpperCase()}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#000000"
            className="font-mono text-xs h-7 flex-1"
          />
          {showAlpha && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">A</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={alpha}
                onChange={(e) => setAlpha(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="h-7 w-14 px-1.5 text-xs text-center"
              />
            </div>
          )}
        </div>
      )}

      {mode === "rgb" && (
        <div className="flex items-center gap-1.5">
          <div className="flex flex-1 items-center gap-1">
            <span className="text-xs text-muted-foreground w-3">R</span>
            <Input
              type="number"
              min={0}
              max={255}
              value={Math.round(rgb.r)}
              onChange={(e) => handleRgbChange("r", e.target.value)}
              className="h-7 px-1.5 text-xs text-center"
            />
          </div>
          <div className="flex flex-1 items-center gap-1">
            <span className="text-xs text-muted-foreground w-3">G</span>
            <Input
              type="number"
              min={0}
              max={255}
              value={Math.round(rgb.g)}
              onChange={(e) => handleRgbChange("g", e.target.value)}
              className="h-7 px-1.5 text-xs text-center"
            />
          </div>
          <div className="flex flex-1 items-center gap-1">
            <span className="text-xs text-muted-foreground w-3">B</span>
            <Input
              type="number"
              min={0}
              max={255}
              value={Math.round(rgb.b)}
              onChange={(e) => handleRgbChange("b", e.target.value)}
              className="h-7 px-1.5 text-xs text-center"
            />
          </div>
          {showAlpha && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">A</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={alpha}
                onChange={(e) => setAlpha(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="h-7 w-12 px-1.5 text-xs text-center"
              />
            </div>
          )}
        </div>
      )}

      {mode === "hsl" && (
        <div className="flex items-center gap-1.5">
          <div className="flex flex-1 items-center gap-1">
            <span className="text-xs text-muted-foreground w-3">H</span>
            <Input
              type="number"
              min={0}
              max={360}
              value={Math.round(hsl.h)}
              onChange={(e) => handleHslChange("h", e.target.value)}
              className="h-7 px-1.5 text-xs text-center"
            />
          </div>
          <div className="flex flex-1 items-center gap-1">
            <span className="text-xs text-muted-foreground w-3">S</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={Math.round(hsl.s)}
              onChange={(e) => handleHslChange("s", e.target.value)}
              className="h-7 px-1.5 text-xs text-center"
            />
          </div>
          <div className="flex flex-1 items-center gap-1">
            <span className="text-xs text-muted-foreground w-3">L</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={Math.round(hsl.l)}
              onChange={(e) => handleHslChange("l", e.target.value)}
              className="h-7 px-1.5 text-xs text-center"
            />
          </div>
          {showAlpha && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">A</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={alpha}
                onChange={(e) => setAlpha(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="h-7 w-12 px-1.5 text-xs text-center"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main ColorPicker Component
interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  showAlpha?: boolean;
  /** Renders a compact color circle trigger instead of a full button */
  compact?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  id,
  className,
  showAlpha = true,
  compact = false,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<ColorMode>("hex");
  const [alpha, setAlphaState] = React.useState(100);
  const [color, setColorState] = React.useState(() => {
    try {
      return Color(value);
    } catch {
      return Color("#000000");
    }
  });

  // Sync external value changes
  React.useEffect(() => {
    try {
      const newColor = Color(value);
      if (newColor.hex() !== color.hex()) {
        setColorState(newColor);
      }
    } catch {
      // Invalid color, ignore
    }
  }, [value]);

  const setColor = React.useCallback(
    (newColor: ColorInstance) => {
      setColorState(newColor);
      if (alpha < 100) {
        const rgb = newColor.rgb().object();
        onChange(`rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha / 100})`);
      } else {
        onChange(newColor.hex().toUpperCase());
      }
    },
    [onChange, alpha]
  );

  const setAlpha = React.useCallback(
    (newAlpha: number) => {
      setAlphaState(newAlpha);
      const rgb = color.rgb().object();
      if (newAlpha < 100) {
        onChange(`rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${newAlpha / 100})`);
      } else {
        onChange(color.hex().toUpperCase());
      }
    },
    [onChange, color]
  );

  const displayValue = alpha < 100 
    ? `rgba(${Math.round(color.rgb().object().r)}, ${Math.round(color.rgb().object().g)}, ${Math.round(color.rgb().object().b)}, ${alpha / 100})`
    : color.hex().toUpperCase();

  return (
    <ColorPickerContext.Provider value={{ color, alpha, setColor, setAlpha, showAlpha }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {compact ? (
            <button
              id={id}
              type="button"
              className={cn(
                "w-5 h-5 rounded-full border-2 border-background shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                className
              )}
              style={{ backgroundColor: color.hex() }}
              aria-label="Select color"
            />
          ) : (
            <Button
              id={id}
              variant="outline"
              className={cn(
                "w-full justify-start gap-2 font-normal h-10",
                className
              )}
            >
              <div
                className="h-5 w-5 rounded-md border border-border shrink-0"
                style={{
                  backgroundColor: color.hex(),
                  opacity: alpha / 100,
                  backgroundImage: alpha < 100 
                    ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px"
                    : undefined,
                }}
              >
                <div
                  className="h-full w-full rounded-md"
                  style={{ backgroundColor: color.hex(), opacity: alpha / 100 }}
                />
              </div>
              <span className="text-sm font-mono truncate">{displayValue}</span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            {/* Color Selection Area */}
            <ColorPickerSelection />

            {/* Hue Slider with Eye Dropper */}
            <div className="flex items-center gap-2">
              <ColorPickerEyeDropper />
              <ColorPickerHue className="flex-1" />
            </div>

            {/* Alpha Slider */}
            {showAlpha && (
              <ColorPickerAlpha />
            )}

            {/* Format Inputs with Mode Tabs */}
            <ColorPickerFormat mode={mode} onModeChange={setMode} />
          </div>
        </PopoverContent>
      </Popover>
    </ColorPickerContext.Provider>
  );
}