import * as React from "react";
import { Check, Palette } from "@untitledui/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DEFAULT_PRESETS = [
  "#000000", "#FFFFFF", "#1E1E1E", "#6366F1",
  "#8B5CF6", "#EC4899", "#F97316", "#EAB308",
  "#22C55E", "#06B6D4", "#3B82F6", "#EF4444",
];

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
  const nativeInputRef = React.useRef<HTMLInputElement>(null);

  const handlePresetClick = (color: string) => {
    onChange(color);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    // Ensure it starts with #
    if (!newValue.startsWith("#")) {
      newValue = "#" + newValue;
    }
    // Limit to 7 characters (#XXXXXX)
    if (newValue.length <= 7) {
      onChange(newValue.toUpperCase());
    }
  };

  const openNativePicker = () => {
    nativeInputRef.current?.click();
  };

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(value);

  return (
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
              style={{ backgroundColor: isValidHex ? value : "#000000" }}
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
            {presets.map((color) => {
              const isSelected = value.toUpperCase() === color.toUpperCase();
              const isLight = isLightColor(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handlePresetClick(color)}
                  className={cn(
                    "h-6 w-6 rounded-md border transition-all flex items-center justify-center",
                    "hover:scale-110 hover:ring-2 hover:ring-ring hover:ring-offset-1",
                    isSelected && "ring-2 ring-ring ring-offset-1",
                    color === "#FFFFFF" ? "border-border" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
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

          {/* Custom Color Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={openNativePicker}
          >
            <Palette className="h-4 w-4" />
            Custom color
          </Button>

          {/* Hidden Native Input */}
          <input
            ref={nativeInputRef}
            type="color"
            value={isValidHex ? value : "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="sr-only"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper to determine if a color is light (for contrast)
function isLightColor(hex: string): boolean {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
