/**
 * WordPress Field Mapper Component
 * 
 * Allows users to map WordPress API fields to target database fields.
 * Shows sample values and auto-suggests mappings based on field name similarity.
 * 
 * @module components/agents/locations/WordPressFieldMapper
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, Check, AlertCircle, ArrowLeft } from '@untitledui/icons';
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
  category: 'basic' | 'address' | 'contact' | 'details' | 'advanced';
}

/** Community target fields */
const COMMUNITY_TARGET_FIELDS: TargetField[] = [
  { key: 'name', label: 'Community Name', required: true, category: 'basic', description: 'Primary name/title' },
  { key: 'address', label: 'Street Address', required: false, category: 'address' },
  { key: 'city', label: 'City', required: false, category: 'address' },
  { key: 'state', label: 'State', required: false, category: 'address' },
  { key: 'zip', label: 'ZIP Code', required: false, category: 'address' },
  { key: 'phone', label: 'Phone', required: false, category: 'contact' },
  { key: 'email', label: 'Email', required: false, category: 'contact' },
  { key: 'latitude', label: 'Latitude', required: false, category: 'details' },
  { key: 'longitude', label: 'Longitude', required: false, category: 'details' },
  { key: 'description', label: 'Description', required: false, category: 'advanced' },
  { key: 'age_category', label: 'Age Category', required: false, category: 'advanced', description: '55+, all ages, etc.' },
  { key: 'community_type', label: 'Community Type', required: false, category: 'advanced', description: 'MHC, RV Park, etc.' },
];

/** Property target fields */
const PROPERTY_TARGET_FIELDS: TargetField[] = [
  { key: 'name', label: 'Listing Title', required: false, category: 'basic' },
  { key: 'address', label: 'Street Address', required: false, category: 'address' },
  { key: 'lot_number', label: 'Lot/Unit Number', required: false, category: 'address' },
  { key: 'city', label: 'City', required: false, category: 'address' },
  { key: 'state', label: 'State', required: false, category: 'address' },
  { key: 'zip', label: 'ZIP Code', required: false, category: 'address' },
  { key: 'price', label: 'Price', required: false, category: 'details', description: 'Will be converted to cents' },
  { key: 'price_type', label: 'Price Type', required: false, category: 'details', description: 'sale, rent, lease' },
  { key: 'beds', label: 'Bedrooms', required: false, category: 'details' },
  { key: 'baths', label: 'Bathrooms', required: false, category: 'details' },
  { key: 'sqft', label: 'Square Footage', required: false, category: 'details' },
  { key: 'year_built', label: 'Year Built', required: false, category: 'details' },
  { key: 'status', label: 'Listing Status', required: false, category: 'advanced', description: 'available, pending, sold' },
  { key: 'description', label: 'Description', required: false, category: 'advanced' },
  { key: 'features', label: 'Features', required: false, category: 'advanced', description: 'Array of feature strings' },
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
  if (str.length > 40) return str.substring(0, 40) + '...';
  return str;
}

function FieldMappingRow({
  targetField,
  availableFields,
  selectedSource,
  suggestedSource,
  onSelect,
}: {
  targetField: TargetField;
  availableFields: AvailableField[];
  selectedSource: string | null;
  suggestedSource?: string;
  onSelect: (source: string | null) => void;
}) {
  const selectedField = availableFields.find(f => f.path === selectedSource);
  const isAutoDetected = selectedSource === suggestedSource && suggestedSource !== undefined;
  
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            {targetField.label}
            {targetField.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {isAutoDetected && (
            <Badge variant="secondary" size="sm" className="text-2xs">
              auto-detected
            </Badge>
          )}
        </div>
        {targetField.description && (
          <p className="text-2xs text-muted-foreground mt-0.5">{targetField.description}</p>
        )}
      </div>
      
      <div className="flex flex-col items-end gap-1 min-w-[200px]">
        <Select
          value={selectedSource || SKIP_VALUE}
          onValueChange={(value) => onSelect(value === SKIP_VALUE ? null : value)}
        >
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="Select source field..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value={SKIP_VALUE} className="text-muted-foreground italic">
              — Skip this field —
            </SelectItem>
            {availableFields.map((field) => (
              <SelectItem key={field.path} value={field.path}>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs">{field.path}</code>
                  {field.path === suggestedSource && (
                    <Check size={12} className="text-status-active" aria-hidden="true" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedField && (
          <span className="text-2xs text-muted-foreground truncate max-w-[200px]">
            {formatSampleValue(selectedField.sampleValue)}
          </span>
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const targetFields = type === 'community' ? COMMUNITY_TARGET_FIELDS : PROPERTY_TARGET_FIELDS;
  
  // Initialize mappings with suggestions on mount
  useEffect(() => {
    if (Object.keys(currentMappings).length === 0 && Object.keys(suggestedMappings).length > 0) {
      onMappingsChange({ ...suggestedMappings });
    }
  }, [suggestedMappings, currentMappings, onMappingsChange]);
  
  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const groups: Record<string, TargetField[]> = {
      basic: [],
      address: [],
      contact: [],
      details: [],
      advanced: [],
    };
    
    for (const field of targetFields) {
      groups[field.category].push(field);
    }
    
    return groups;
  }, [targetFields]);
  
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
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  const renderFieldGroup = (title: string, fields: TargetField[]) => {
    if (fields.length === 0) return null;
    
    return (
      <div className="space-y-1">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {title}
        </h4>
        {fields.map((field) => (
          <FieldMappingRow
            key={field.key}
            targetField={field}
            availableFields={availableFields}
            selectedSource={currentMappings[field.key] || null}
            suggestedSource={suggestedMappings[field.key]}
            onSelect={(source) => handleFieldSelect(field.key, source)}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold">
            Map {type === 'community' ? 'Community' : 'Property'} Fields
          </h3>
          <Badge variant="secondary" size="sm">
            {mappedCount} mapped
          </Badge>
        </div>
        {samplePostTitle && (
          <p className="text-xs text-muted-foreground">
            Fields from sample: <span className="font-medium text-foreground">{samplePostTitle}</span>
          </p>
        )}
      </div>
      
      {/* Required warning */}
      {!allRequiredMapped && (
        <div className="flex items-start gap-2 p-2 bg-status-draft/10 rounded-md text-xs">
          <AlertCircle size={14} className="text-status-draft shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-status-draft-foreground">
            Required fields must be mapped: {requiredFields.filter(f => !currentMappings[f.key]).map(f => f.label).join(', ')}
          </span>
        </div>
      )}
      
      {/* Field groups */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {renderFieldGroup('Basic', fieldsByCategory.basic)}
        {renderFieldGroup('Address', fieldsByCategory.address)}
        {renderFieldGroup('Contact', fieldsByCategory.contact)}
        {renderFieldGroup('Details', fieldsByCategory.details)}
        
        {/* Advanced fields in collapsible */}
        {fieldsByCategory.advanced.length > 0 && (
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown 
                size={14} 
                className={cn("transition-transform", showAdvanced && "rotate-180")} 
                aria-hidden="true" 
              />
              Advanced fields ({fieldsByCategory.advanced.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {renderFieldGroup('', fieldsByCategory.advanced)}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
      
      {/* Available fields reference */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown size={14} className="transition-transform" aria-hidden="true" />
          View all {availableFields.length} available source fields
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="p-2 bg-muted/50 rounded-md max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {availableFields.map((field) => (
                <code key={field.path} className="text-2xs font-mono bg-background px-1.5 py-0.5 rounded">
                  {field.path}
                </code>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={isSaving}
        >
          <ArrowLeft size={16} className="mr-1" aria-hidden="true" />
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
