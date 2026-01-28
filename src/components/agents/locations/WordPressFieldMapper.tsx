/**
 * WordPress Field Mapper Component
 * 
 * Premium Airtable-style two-column UI for mapping WordPress API fields 
 * to target database fields. Features table-based layout with consistent
 * column widths and searchable dropdowns.
 * 
 * @module components/agents/locations/WordPressFieldMapper
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ArrowLeft, Check, ChevronDown } from '@untitledui/icons';
import { cn } from '@/lib/utils';

/** Field available from WordPress API */
export interface AvailableField {
  path: string;
  sampleValue: string | number | boolean | null;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
}

/** Target field definition */
interface TargetField {
  key: string;
  label: string;
  required: boolean;
  description?: string;
}

/** Community target fields */
const COMMUNITY_TARGET_FIELDS: TargetField[] = [
  { key: 'name', label: 'Community Name', required: true, description: 'Primary name/title' },
  { key: 'address', label: 'Street Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zip', label: 'ZIP Code', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'description', label: 'Description', required: false },
  { key: 'amenities', label: 'Amenities', required: false, description: 'Array of amenities' },
  { key: 'pet_policy', label: 'Pet Policy', required: false },
  { key: 'age_category', label: 'Age Category', required: false, description: '55+, all ages, etc.' },
  { key: 'utilities_included', label: 'Utilities Included', required: false, description: 'Water, trash, electric' },
];

/** Property target fields */
const PROPERTY_TARGET_FIELDS: TargetField[] = [
  { key: 'name', label: 'Listing Title', required: false },
  { key: 'address', label: 'Street Address', required: false },
  { key: 'lot_number', label: 'Lot/Unit Number', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zip', label: 'ZIP Code', required: false },
  { key: 'price', label: 'Price', required: false, description: 'Will be converted to cents' },
  { key: 'price_type', label: 'Price Type', required: false, description: 'sale, rent, lease' },
  { key: 'beds', label: 'Bedrooms', required: false },
  { key: 'baths', label: 'Bathrooms', required: false },
  { key: 'sqft', label: 'Square Footage', required: false },
  { key: 'year_built', label: 'Year Built', required: false },
  { key: 'manufacturer', label: 'Manufacturer', required: false, description: 'Home manufacturer/builder' },
  { key: 'model', label: 'Model', required: false, description: 'Home model name' },
  { key: 'lot_rent', label: 'Lot Rent', required: false, description: 'Monthly lot rent' },
  { key: 'status', label: 'Listing Status', required: false, description: 'available, pending, sold' },
  { key: 'virtual_tour_url', label: 'Virtual Tour URL', required: false },
  { key: 'community_type', label: 'Community Type', required: false, description: '55+, all ages' },
  { key: 'description', label: 'Description', required: false },
  { key: 'features', label: 'Features', required: false, description: 'Array of feature strings' },
];

export interface WordPressFieldMapperProps {
  type: 'community' | 'property';
  availableFields: AvailableField[];
  currentMappings: Record<string, string>;
  suggestedMappings: Record<string, string>;
  onMappingsChange: (mappings: Record<string, string>) => void;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  samplePostTitle?: string;
}

function formatSampleValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  const str = String(value);
  if (str.length > 40) return str.substring(0, 40) + '...';
  return str;
}

/** Searchable field select using Popover + Command pattern */
interface SearchableFieldSelectProps {
  availableFields: AvailableField[];
  selectedSource: string | null;
  onSelect: (source: string | null) => void;
  isMapped: boolean;
}

function SearchableFieldSelect({
  availableFields,
  selectedSource,
  onSelect,
  isMapped,
}: SearchableFieldSelectProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between bg-background border-border/60",
            "hover:border-primary/50 transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isMapped && "border-primary/30"
          )}
        >
          {selectedSource ? (
            <code className="font-mono text-xs truncate">{selectedSource}</code>
          ) : (
            <span className="text-muted-foreground italic">Don't import</span>
          )}
          <ChevronDown size={16} className="ml-2 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="min-w-[320px] w-auto max-w-[400px] p-0 bg-popover" 
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search fields..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No fields found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__skip__"
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="text-muted-foreground italic"
              >
                {selectedSource === null && (
                  <Check size={16} className="mr-2 shrink-0" aria-hidden="true" />
                )}
                Don't import
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {availableFields.map((field) => (
                <CommandItem
                  key={field.path}
                  value={field.path}
                  onSelect={() => {
                    onSelect(field.path);
                    setOpen(false);
                  }}
                >
                  {selectedSource === field.path && (
                    <Check size={16} className="mr-2 shrink-0" aria-hidden="true" />
                  )}
                  <code className="font-mono text-xs">{field.path}</code>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Compact SVG connection line between source and target */
function ConnectionLine({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center h-full">
      <svg 
        className="w-8 h-4" 
        viewBox="0 0 32 16" 
        fill="none"
        aria-hidden="true"
      >
        <line 
          x1="0" y1="8" x2="24" y2="8" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeDasharray={isActive ? "0" : "4 4"}
          className={cn(
            "transition-all duration-300",
            isActive ? "text-primary" : "text-muted-foreground/30"
          )}
        />
        <polygon 
          points="22,4 30,8 22,12" 
          fill="currentColor"
          className={cn(
            "transition-all duration-300",
            isActive ? "text-primary" : "text-muted-foreground/30"
          )}
        />
      </svg>
    </div>
  );
}

interface MappingRowProps {
  targetField: TargetField;
  availableFields: AvailableField[];
  selectedSource: string | null;
  suggestedSource?: string;
  onSelect: (source: string | null) => void;
  isLast: boolean;
}

function MappingRow({
  targetField,
  availableFields,
  selectedSource,
  suggestedSource,
  onSelect,
  isLast,
}: MappingRowProps) {
  const sourceField = availableFields.find(f => f.path === selectedSource);
  const isMapped = !!selectedSource;
  const isAutoDetected = selectedSource === suggestedSource && suggestedSource !== undefined;
  
  return (
    <div className={cn(
      "grid grid-cols-[1fr_48px_1fr] transition-colors",
      !isLast && "border-b border-border",
      isMapped ? "bg-card" : "bg-background hover:bg-muted/20"
    )}>
      {/* Source Cell */}
      <div className="px-4 py-4 space-y-2">
        <SearchableFieldSelect
          availableFields={availableFields}
          selectedSource={selectedSource}
          onSelect={onSelect}
          isMapped={isMapped}
        />
        {sourceField && (
          <p className="text-xs text-muted-foreground truncate pl-0.5">
            {formatSampleValue(sourceField.sampleValue)}
          </p>
        )}
      </div>
      
      {/* Connector Cell */}
      <div className="flex items-center justify-center">
        <ConnectionLine isActive={isMapped} />
      </div>
      
      {/* Target Cell */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">
            {targetField.label}
            {targetField.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </span>
          {isAutoDetected && (
            <span className="text-2xs text-muted-foreground/70 font-medium uppercase tracking-wide shrink-0">
              auto
            </span>
          )}
        </div>
        {targetField.description && (
          <p className="text-xs text-muted-foreground mt-1">{targetField.description}</p>
        )}
      </div>
    </div>
  );
}

export function WordPressFieldMapper({
  type,
  availableFields,
  currentMappings,
  suggestedMappings,
  onMappingsChange,
  onConfirm,
  onBack,
  isLoading = false,
  isSaving = false,
  samplePostTitle,
}: WordPressFieldMapperProps) {
  const targetFields = type === 'community' ? COMMUNITY_TARGET_FIELDS : PROPERTY_TARGET_FIELDS;
  
  // Initialize mappings with suggestions on mount
  useEffect(() => {
    if (Object.keys(currentMappings).length === 0 && Object.keys(suggestedMappings).length > 0) {
      onMappingsChange({ ...suggestedMappings });
    }
  }, [suggestedMappings, currentMappings, onMappingsChange]);
  
  const handleFieldSelect = (targetKey: string, sourceField: string | null) => {
    const newMappings = { ...currentMappings };
    if (sourceField === null) {
      delete newMappings[targetKey];
    } else {
      newMappings[targetKey] = sourceField;
    }
    onMappingsChange(newMappings);
  };
  
  // Check if required fields are mapped
  const requiredFields = targetFields.filter(f => f.required);
  const allRequiredMapped = requiredFields.every(f => currentMappings[f.key]);
  
  // Count mapped fields
  const mappedCount = Object.keys(currentMappings).length;
  const totalFields = targetFields.length;
  const progressPercent = (mappedCount / totalFields) * 100;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-sm text-muted-foreground">Loading fields...</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Map {type === 'community' ? 'Community' : 'Property'} Fields
          </h2>
          {samplePostTitle && (
            <p className="text-sm text-muted-foreground">
              Using sample: <span className="font-medium text-foreground">{samplePostTitle}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground tabular-nums">
              {mappedCount}
            </span>
            <span className="text-sm text-muted-foreground">of {totalFields} mapped</span>
          </div>
          <Progress 
            value={progressPercent} 
            className="w-24 h-2.5" 
            variant={progressPercent === 100 ? "success" : "default"}
          />
        </div>
      </div>
      
      {/* Unified Table Container */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Column Headers - Inside the table */}
          <div className="grid grid-cols-[1fr_48px_1fr] bg-muted/50 border-b border-border sticky top-0 z-10">
            <div className="px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-foreground">Source Field</span>
              <span className="text-xs text-muted-foreground">(WordPress)</span>
            </div>
            <div className="flex items-center justify-center">
              {/* Connector header placeholder */}
            </div>
            <div className="px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-foreground" />
              <span className="text-sm font-semibold text-foreground">Target Field</span>
              <span className="text-xs text-muted-foreground">(Database)</span>
            </div>
          </div>
          
          {/* Rows */}
          {targetFields.map((field, index) => (
            <MappingRow
              key={field.key}
              targetField={field}
              availableFields={availableFields}
              selectedSource={currentMappings[field.key] || null}
              suggestedSource={suggestedMappings[field.key]}
              onSelect={(source) => handleFieldSelect(field.key, source)}
              isLast={index === targetFields.length - 1}
            />
          ))}
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 shrink-0">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
        >
          <ArrowLeft size={16} className="mr-2" aria-hidden="true" />
          Back
        </Button>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => onMappingsChange({})}
            disabled={isSaving || mappedCount === 0}
          >
            Clear All
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSaving || !allRequiredMapped}
          >
            {isSaving ? 'Saving...' : 'Save Mappings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
