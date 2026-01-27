/**
 * WordPress Integration Type Definitions
 * 
 * Types for WordPress API integration, field mapping, and sync configuration.
 * 
 * @module types/wordpress
 */

/** Field available from WordPress API with sample value */
export interface AvailableField {
  path: string;
  sampleValue: string | number | boolean | null;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
}

/** Result from fetching sample post */
export interface SamplePostResult {
  success: boolean;
  samplePost?: {
    id: number;
    title: string;
  };
  availableFields: AvailableField[];
  suggestedMappings: Record<string, string>;
  error?: string;
}

/** WordPress configuration stored in agent deployment_config */
export interface WordPressConfig {
  site_url: string;
  community_endpoint?: string;
  home_endpoint?: string;
  last_community_sync?: string;
  community_count?: number;
  community_sync_interval?: string;
  home_sync_interval?: string;
  last_home_sync?: string;
  home_count?: number;
  /** Field mappings: target field → source field path */
  community_field_mappings?: Record<string, string>;
  /** Field mappings: target field → source field path */
  property_field_mappings?: Record<string, string>;
}

/** Discovered endpoint from WordPress REST API */
export interface DiscoveredEndpoint {
  slug: string;
  name: string;
  rest_base: string;
  classification?: 'community' | 'home' | 'unknown';
  confidence?: number;
  signals?: string[];
  postCount?: number;
}

/** Collection of discovered endpoints */
export interface DiscoveredEndpoints {
  communityEndpoints: DiscoveredEndpoint[];
  homeEndpoints: DiscoveredEndpoint[];
  unclassifiedEndpoints?: DiscoveredEndpoint[];
}

/** Sync result from WordPress integration */
export interface WordPressSyncResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  total: number;
  sync_type?: 'full' | 'incremental';
  errors?: string[];
}
