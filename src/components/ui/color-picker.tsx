"use client";

import * as React from "react";
import Color from "color";
import { Dropper, Check } from "@untitledui/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Type alias for Color instance
type ColorInstance = InstanceType<typeof Color>;

// Default preset colors
const DEFAULT_PRESETS = [
  "#000000", "#FFFFFF", "#1E1E1E", "#6366F1",
  "#8B5CF6", "#EC4899", "#F97316", "#EAB308",
  "#22C55E", "#06B6D4", "#3B82F6", "#EF4444",
];

// Color Picker Context
interface ColorPickerContextValue {
  color: ColorInstance;
  setColor: (color: ColorInstance) => void;
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
    >
      <Dropper className="h-4 w-4" />
    </Button>
  );
}

// RGB Input Fields
interface ColorPickerFormatProps {
  className?: string;
}

function ColorPickerFormat({ className }: ColorPickerFormatProps) {
  const { color, setColor } = useColorPicker();

  const rgb = color.rgb().object();

  const handleChange = (channel: "r" | "g" | "b", value: string) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...rgb, [channel]: num };
    setColor(Color.rgb(newRgb.r, newRgb.g, newRgb.b));
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex flex-1 items-center gap-1">
        <span className="text-xs text-muted-foreground w-3">R</span>
        <Input
          type="number"
          min={0}
          max={255}
          value={Math.round(rgb.r)}
          onChange={(e) => handleChange("r", e.target.value)}
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
          onChange={(e) => handleChange("g", e.target.value)}
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
          onChange={(e) => handleChange("b", e.target.value)}
          className="h-7 px-1.5 text-xs text-center"
        />
      </div>
    </div>
  );
}

// Main ColorPicker Component
interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
  id?: string;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  id,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
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
      onChange(newColor.hex().toUpperCase());
    },
    [onChange]
  );

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (!newValue.startsWith("#")) {
      newValue = "#" + newValue;
    }
    if (newValue.length <= 7) {
      try {
        const newColor = Color(newValue);
        setColor(newColor);
      } catch {
        // Invalid color, just update the input
        onChange(newValue.toUpperCase());
      }
    }
  };

  const handlePresetClick = (presetColor: string) => {
    try {
      setColor(Color(presetColor));
    } catch {
      // Invalid preset
    }
  };

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(value);

  return (
    <ColorPickerContext.Provider value={{ color, setColor }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
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
              style={{ backgroundColor: isValidHex ? value : "#000000" }}
            />
            <span className="text-sm font-mono">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            {/* Hex Input */}
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-md border border-border shrink-0"
                style={{ backgroundColor: color.hex() }}
              />
              <Input
                value={value}
                onChange={handleHexChange}
                placeholder="#000000"
                className="font-mono text-sm h-9"
              />
            </div>

            {/* Preset Colors */}
            <div className="grid grid-cols-6 gap-1.5">
              {presets.map((presetColor) => {
                const isSelected = value.toUpperCase() === presetColor.toUpperCase();
                const isLight = isLightColor(presetColor);
                return (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => handlePresetClick(presetColor)}
                    className={cn(
                      "h-6 w-6 rounded-md border flex items-center justify-center",
                      isSelected && "ring-2 ring-ring ring-offset-1",
                      presetColor === "#FFFFFF" ? "border-border" : "border-transparent"
                    )}
                    style={{ backgroundColor: presetColor }}
                  >
                    {isSelected && (
                      <Check
                        className={cn(
                          "h-3.5 w-3.5",
                          isLight ? "text-foreground" : "text-white"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Color Selection Area */}
            <ColorPickerSelection />

            {/* Hue Slider with Eye Dropper */}
            <div className="flex items-center gap-2">
              <ColorPickerEyeDropper />
              <ColorPickerHue className="flex-1" />
            </div>

            {/* RGB Inputs */}
            <ColorPickerFormat />
          </div>
        </PopoverContent>
      </Popover>
    </ColorPickerContext.Provider>
  );
}

// Helper to determine if a color is light (for contrast)
function isLightColor(hex: string): boolean {
  try {
    return Color(hex).isLight();
  } catch {
    return false;
  }
}
