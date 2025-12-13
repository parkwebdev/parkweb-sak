/**
 * Property Type Definitions
 * 
 * Types for real estate/property listings extracted from knowledge sources.
 * Used for mobile home parks, apartments, and other property types.
 * 
 * @module types/properties
 */

import type { Tables } from '@/integrations/supabase/types';

/**
 * Property from database
 */
export type Property = Tables<'properties'>;

/**
 * Property status enum values
 */
export type PropertyStatus = 'available' | 'pending' | 'sold' | 'rented' | 'coming_soon';

/**
 * Property price type enum values
 */
export type PropertyPriceType = 'sale' | 'rent_monthly' | 'rent_weekly';

/**
 * Property image in the images JSONB array
 */
export interface PropertyImage {
  url: string;
  alt?: string;
  order?: number;
}

/**
 * Extracted property data from AI extraction
 */
export interface ExtractedProperty {
  /** External ID from the source (lot number, listing ID, etc.) */
  external_id: string;
  /** Street address */
  address?: string;
  /** Lot/unit number */
  lot_number?: string;
  /** City */
  city?: string;
  /** State */
  state?: string;
  /** ZIP code */
  zip?: string;
  /** Listing status */
  status?: PropertyStatus;
  /** Price in cents */
  price?: number;
  /** Price type */
  price_type?: PropertyPriceType;
  /** Number of bedrooms */
  beds?: number;
  /** Number of bathrooms */
  baths?: number;
  /** Square footage */
  sqft?: number;
  /** Year built */
  year_built?: number;
  /** Property description */
  description?: string;
  /** Feature list */
  features?: string[];
  /** Image URLs */
  images?: PropertyImage[];
  /** Direct link to listing */
  listing_url?: string;
}

/**
 * Property extraction config stored in knowledge_sources.extraction_config
 */
export interface PropertyExtractionConfig {
  /** CSS selectors or hints for extraction */
  selectors?: {
    listing_container?: string;
    price?: string;
    address?: string;
    beds?: string;
    baths?: string;
    sqft?: string;
  };
  /** Field mappings for structured data */
  field_mappings?: Record<string, string>;
  /** Additional extraction hints for AI */
  extraction_hints?: string;
}

/**
 * Format price for display
 */
export function formatPrice(priceInCents: number | null, priceType?: PropertyPriceType): string {
  if (priceInCents === null || priceInCents === undefined) return 'Contact for price';
  
  const price = priceInCents / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  switch (priceType) {
    case 'rent_monthly':
      return `${formatted}/mo`;
    case 'rent_weekly':
      return `${formatted}/wk`;
    default:
      return formatted;
  }
}

/**
 * Get status badge variant
 */
export function getStatusVariant(status: PropertyStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'available':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'sold':
    case 'rented':
      return 'outline';
    case 'coming_soon':
      return 'secondary';
    default:
      return 'default';
  }
}
