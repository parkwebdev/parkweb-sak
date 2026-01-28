/**
 * WordPressEndpointMapper Component
 * 
 * Displays discovered WordPress endpoints and allows users to map them
 * to Communities and Properties data types.
 * 
 * @module components/agents/locations/WordPressEndpointMapper
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building01, Home01, AlertTriangle, Check, XClose } from '@untitledui/icons';
import { cn } from '@/lib/utils';

export interface DiscoveredEndpoint {
  slug: string;
  name: string;
  rest_base: string;
  classification?: 'community' | 'home' | 'unknown';
  confidence?: number;
  signals?: string[];
  postCount?: number;
}

export interface DiscoveredEndpoints {
  communityEndpoints: DiscoveredEndpoint[];
  homeEndpoints: DiscoveredEndpoint[];
  unclassifiedEndpoints?: DiscoveredEndpoint[];
}

interface WordPressEndpointMapperProps {
  discoveredEndpoints: DiscoveredEndpoints;
  selectedCommunityEndpoint: string | null;
  selectedPropertyEndpoint: string | null;
  onCommunitySelect: (endpoint: string | null) => void;
  onPropertySelect: (endpoint: string | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function getConfidenceStyle(confidence: number): { label: string; className: string } {
  if (confidence >= 0.7) return { label: 'High match', className: 'text-status-active' };
  if (confidence >= 0.4) return { label: 'Possible match', className: 'text-warning' };
  return { label: 'Low match', className: 'text-muted-foreground' };
}

/**
 * Calculate display confidence based on section context
 * - If endpoint classification matches section type → use raw confidence
 * - If endpoint classification is opposite → reduce to low confidence
 * - If unknown → moderate penalty
 */
function getContextualConfidence(
  endpoint: DiscoveredEndpoint,
  sectionType: 'community' | 'property'
): number {
  const classification = endpoint.classification;
  const rawConfidence = endpoint.confidence || 0;

  // Matching classification - use raw confidence
  if (
    (sectionType === 'community' && classification === 'community') ||
    (sectionType === 'property' && classification === 'home')
  ) {
    return rawConfidence;
  }

  // Opposite classification - significantly reduce confidence
  if (
    (sectionType === 'community' && classification === 'home') ||
    (sectionType === 'property' && classification === 'community')
  ) {
    return Math.max(0.1, 0.3 - rawConfidence * 0.3);
  }

  // Unknown classification - moderate confidence
  return 0.35;
}

interface EndpointOptionProps {
  endpoint: DiscoveredEndpoint;
  isSelected: boolean;
  onSelect: () => void;
  radioValue: string;
  sectionType: 'community' | 'property';
}

function EndpointOption({ endpoint, isSelected, onSelect, radioValue, sectionType }: EndpointOptionProps) {
  const contextualConfidence = getContextualConfidence(endpoint, sectionType);
  const confidence = getConfidenceStyle(contextualConfidence);

  // Check if this endpoint is the "wrong type" for this section
  const isWrongType =
    (sectionType === 'community' && endpoint.classification === 'home') ||
    (sectionType === 'property' && endpoint.classification === 'community');
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <RadioGroupItem value={radioValue} id={radioValue} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-medium text-foreground">
            {endpoint.rest_base}
          </code>
          {endpoint.postCount != null && endpoint.postCount > 0 && (
            <Badge variant="secondary" size="sm">
              {endpoint.postCount} items
            </Badge>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className={cn('text-xs mt-0.5 cursor-help', confidence.className)}>
                {confidence.label}
                {!isWrongType && contextualConfidence >= 0.7 && (
                  <Check size={12} className="inline ml-1" aria-hidden="true" />
                )}
                {isWrongType && (
                  <span className="text-muted-foreground ml-1">
                    (classified as {endpoint.classification})
                  </span>
                )}
              </p>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              {isWrongType && (
                <p className="text-xs text-warning mb-2">
                  This endpoint was classified as a {endpoint.classification === 'home' ? 'Property' : 'Community'} type
                </p>
              )}
              {endpoint.signals && endpoint.signals.length > 0 && (
                <>
                  <p className="text-xs font-medium mb-1">Detection signals:</p>
                  <ul className="text-2xs text-muted-foreground space-y-0.5">
                    {endpoint.signals.map((signal, i) => (
                      <li key={i}>• {signal}</li>
                    ))}
                  </ul>
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function WordPressEndpointMapper({
  discoveredEndpoints,
  selectedCommunityEndpoint,
  selectedPropertyEndpoint,
  onCommunitySelect,
  onPropertySelect,
  onConfirm,
  onCancel,
  isLoading = false,
}: WordPressEndpointMapperProps) {
  // Combine all endpoints for selection
  const allEndpoints = [
    ...discoveredEndpoints.communityEndpoints,
    ...discoveredEndpoints.homeEndpoints,
    ...(discoveredEndpoints.unclassifiedEndpoints || []),
  ];

  // Sort endpoints by relevance for each section
  const communityOrderedEndpoints = [...allEndpoints].sort((a, b) => {
    return getContextualConfidence(b, 'community') - getContextualConfidence(a, 'community');
  });

  const propertyOrderedEndpoints = [...allEndpoints].sort((a, b) => {
    return getContextualConfidence(b, 'property') - getContextualConfidence(a, 'property');
  });

  // Check if same endpoint selected for both
  const hasDuplicateSelection =
    selectedCommunityEndpoint &&
    selectedPropertyEndpoint &&
    selectedCommunityEndpoint === selectedPropertyEndpoint;

  // Pre-select best matches if nothing selected
  const suggestedCommunity = communityOrderedEndpoints[0]?.rest_base || null;
  const suggestedProperty = propertyOrderedEndpoints[0]?.rest_base || null;

  const effectiveCommunityEndpoint = selectedCommunityEndpoint ?? suggestedCommunity;
  const effectivePropertyEndpoint = selectedPropertyEndpoint ?? suggestedProperty;

  const noEndpointsFound = allEndpoints.length === 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Map Endpoints</h3>
        <p className="text-xs text-muted-foreground">
          We found {allEndpoints.length} custom post types. Select which ones to sync.
        </p>
      </div>

      {noEndpointsFound ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <AlertTriangle size={24} className="mx-auto text-warning mb-2" aria-hidden="true" />
          <p className="text-sm font-medium">No custom post types found</p>
          <p className="text-xs text-muted-foreground mt-1">
            This site may not have REST API enabled or no custom post types are registered.
          </p>
        </div>
      ) : (
        <>
          {/* Communities Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building01 size={16} className="text-muted-foreground" aria-hidden="true" />
              <Label className="text-sm font-medium">Communities (Locations)</Label>
            </div>
            
            <RadioGroup
              value={effectiveCommunityEndpoint ? `community-${effectiveCommunityEndpoint}` : 'community-none'}
              onValueChange={(value) => onCommunitySelect(value === 'community-none' ? null : value.replace('community-', ''))}
              className="space-y-2"
            >
              {communityOrderedEndpoints.map((endpoint) => (
                <EndpointOption
                  key={`community-${endpoint.rest_base}`}
                  endpoint={endpoint}
                  isSelected={effectiveCommunityEndpoint === endpoint.rest_base}
                  onSelect={() => onCommunitySelect(endpoint.rest_base)}
                  radioValue={`community-${endpoint.rest_base}`}
                  sectionType="community"
                />
              ))}
              
              {/* None option */}
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  effectiveCommunityEndpoint === null
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                )}
                onClick={() => onCommunitySelect(null)}
              >
                <RadioGroupItem value="community-none" id="community-none" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Don't sync communities
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Properties Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Home01 size={16} className="text-muted-foreground" aria-hidden="true" />
              <Label className="text-sm font-medium">Properties (Homes/Listings)</Label>
            </div>
            
            <RadioGroup
              value={effectivePropertyEndpoint ? `property-${effectivePropertyEndpoint}` : 'property-none'}
              onValueChange={(value) => onPropertySelect(value === 'property-none' ? null : value.replace('property-', ''))}
              className="space-y-2"
            >
              {propertyOrderedEndpoints.map((endpoint) => (
                <EndpointOption
                  key={`property-${endpoint.rest_base}`}
                  endpoint={endpoint}
                  isSelected={effectivePropertyEndpoint === endpoint.rest_base}
                  onSelect={() => onPropertySelect(endpoint.rest_base)}
                  radioValue={`property-${endpoint.rest_base}`}
                  sectionType="property"
                />
              ))}
              
              {/* None option */}
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  effectivePropertyEndpoint === null
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                )}
                onClick={() => onPropertySelect(null)}
              >
                <RadioGroupItem value="property-none" id="property-none" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Don't sync properties
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Duplicate warning */}
          {hasDuplicateSelection && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-xs">
                <p className="font-medium text-foreground">Same endpoint selected for both</p>
                <p className="text-muted-foreground mt-0.5">
                  This is allowed but unusual. The same data will be imported as both communities and properties.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          <XClose size={16} className="mr-1.5" aria-hidden="true" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isLoading || noEndpointsFound || (!effectiveCommunityEndpoint && !effectivePropertyEndpoint)}
          loading={isLoading}
        >
          <Check size={16} className="mr-1.5" aria-hidden="true" />
          Save & Connect
        </Button>
      </div>
    </div>
  );
}
