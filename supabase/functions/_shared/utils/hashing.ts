/**
 * Hashing Utilities
 * Provides SHA-256 hashing for query caching.
 * 
 * @module _shared/utils/hashing
 * @description Cryptographic hashing utilities using Web Crypto API.
 * 
 * @example
 * ```typescript
 * import { hashString, hashQuery } from "../_shared/utils/hashing.ts";
 * 
 * const hash = await hashString("some_string");
 * const queryHash = await hashQuery("search query");
 * ```
 */

/**
 * Simple SHA-256 hash function.
 * 
 * @param input - String to hash
 * @returns Hex-encoded SHA-256 hash
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a query string for cache lookups.
 * Uses the same SHA-256 algorithm.
 * 
 * @param query - Query string to hash
 * @returns Hex-encoded SHA-256 hash
 */
export async function hashQuery(query: string): Promise<string> {
  return hashString(query);
}

/**
 * Normalize a query for consistent cache matching.
 * Converts to lowercase and removes extra whitespace.
 * 
 * @param query - Query string to normalize
 * @returns Normalized query string
 */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}
