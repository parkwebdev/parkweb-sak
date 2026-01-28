/**
 * WordPress Field Mapper Component
 * 
 * Two-column CSV-importer-style UI for mapping WordPress API fields 
 * to target database fields. Shows sample values and auto-suggests mappings.
 * 
 * @module components/agents/locations/WordPressFieldMapper
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { ArrowRight, ArrowLeft } from '@untitledui/icons';
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

const SKIP_VALUE = '__skip__';

function formatSampleValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  const str = String(value);
  if (str.length > 50) return str.substring(0, 50) + '...';
  return str;
}

interface MappingRowProps {
  targetField: TargetField;
  availableFields: AvailableField[];
  selectedSource: string | null;
  suggestedSource?: string;
  onSelect: (source: string | null) => void;
}

function MappingRow({
  targetField,
  availableFields,
  selectedSource,
  suggestedSource,
  onSelect,
}: MappingRowProps) {
  const sourceField = availableFields.find(f => f.path === selectedSource);
  const isMapped = !!selectedSource;
  const isAutoDetected = selectedSource === suggestedSource && suggestedSource !== undefined;
  
  return (
    <div className={cn(
      "grid grid-cols-[1fr_40px_1fr] gap-3 items-start py-3 px-3 rounded-lg transition-colors",
      isMapped ? "bg-muted/40" : "bg-transparent hover:bg-muted/20"
    )}>
      {/* Source Column */}
      <div className="space-y-1.5">
        <Select
          value={selectedSource || SKIP_VALUE}
          onValueChange={(value) => onSelect(value === SKIP_VALUE ? null : value)}
        >
          <SelectTrigger className="h-9 bg-background text-xs">
            <SelectValue placeholder="Select source field..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value={SKIP_VALUE} className="text-muted-foreground italic">
              Don't import
            </SelectItem>
            <SelectSeparator />
            {availableFields.map((field) => (
              <SelectItem key={field.path} value={field.path}>
                <code className="font-mono text-xs">{field.path}</code>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Sample value preview */}
        {sourceField && (
          <div className="px-2.5 py-1.5 bg-muted/60 rounded text-xs text-muted-foreground truncate border border-border/50">
            {formatSampleValue(sourceField.sampleValue)}
          </div>
        )}
      </div>
      
      {/* Arrow Column */}
      <div className="flex justify-center pt-2">
        {isMapped ? (
          <ArrowRight size={18} className="text-primary" aria-hidden="true" />
        ) : (
          <div className="w-4 border-t border-dashed border-muted-foreground/30 mt-2" />
        )}
      </div>
      
      {/* Target Column */}
      <div className="space-y-0.5 pt-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            {targetField.label}
            {targetField.required && <span className="text-destructive ml-0.5">*</span>}
          </span>
          {isAutoDetected && (
            <Badge variant="secondary" size="sm" className="text-2xs">
              auto
            </Badge>
          )}
        </div>
        {targetField.description && (
          <p className="text-xs text-muted-foreground">{targetField.description}</p>
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
      <div className="flex items-center justify-between pb-4 border-b shrink-0">
        <div>
          <h2 className="text-base font-semibold">
            Map {type === 'community' ? 'Community' : 'Property'} Fields
          </h2>
          {samplePostTitle && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Sample: <span className="font-medium text-foreground">{samplePostTitle}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">
            {mappedCount} of {totalFields} mapped
          </span>
          <Progress 
            value={progressPercent} 
            className="w-20 h-2" 
            variant={mappedCount > 0 ? "success" : "default"}
          />
        </div>
      </div>
      
      {/* Column Headers */}
      <div className="grid grid-cols-[1fr_40px_1fr] gap-3 py-3 px-3 border-b sticky top-0 bg-background z-10 shrink-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Source (WordPress)
        </div>
        <div /> {/* Arrow column spacer */}
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Target (Database)
        </div>
      </div>
      
      {/* Scrollable Mapping Rows */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 min-h-0">
        {targetFields.map((field) => (
          <MappingRow
            key={field.key}
            targetField={field}
            availableFields={availableFields}
            selectedSource={currentMappings[field.key] || null}
            suggestedSource={suggestedMappings[field.key]}
            onSelect={(source) => handleFieldSelect(field.key, source)}
          />
        ))}
      </div>
      
      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={isSaving}
        >
          <ArrowLeft size={16} className="mr-1.5" aria-hidden="true" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMappingsChange({})}
            disabled={isSaving || mappedCount === 0}
          >
            Clear All
          </Button>
          <Button
            size="sm"
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
