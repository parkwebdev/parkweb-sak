/**
 * LocationPicker Component
 * 
 * UI component for selecting a location when auto-detection fails.
 * Displays available locations with city/state info.
 * 
 * @module widget/components/LocationPicker
 */

import { MarkerPin01 } from '../icons';
import type { DetectedLocation } from '../hooks/useLocationDetection';

interface LocationPickerProps {
  /** Available locations to choose from */
  locations: DetectedLocation[];
  /** Currently selected location */
  selectedLocation?: DetectedLocation | null;
  /** Callback when location is selected */
  onSelect: (locationId: string) => void;
  /** Primary color for styling */
  primaryColor?: string;
  /** Prompt text to display */
  prompt?: string;
}

export function LocationPicker({
  locations,
  selectedLocation,
  onSelect,
  primaryColor = '#000000',
  prompt = 'Which community are you interested in?',
}: LocationPickerProps) {
  if (locations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-medium text-center mb-4">{prompt}</p>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {locations.map((location) => {
          const isSelected = selectedLocation?.id === location.id;
          const locationLine = [location.city, location.state].filter(Boolean).join(', ');
          
          return (
            <button
              key={location.id}
              onClick={() => onSelect(location.id)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                ${isSelected 
                  ? 'border-2 bg-opacity-10' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
              style={{
                borderColor: isSelected ? primaryColor : undefined,
                backgroundColor: isSelected ? `${primaryColor}10` : undefined,
              }}
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <MarkerPin01 
                  className="w-4 h-4" 
                  style={{ color: primaryColor }} 
                />
              </div>
              
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{location.name}</p>
                {locationLine && (
                  <p className="text-xs text-muted-foreground">{locationLine}</p>
                )}
              </div>
              
              {isSelected && (
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
