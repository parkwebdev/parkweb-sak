/**
 * Paginated Query Hook Foundation
 * 
 * Foundation hook for implementing infinite scroll with cursor-based pagination.
 * Use this pattern for large data lists (leads, conversations, messages).
 * 
 * @module hooks/usePaginatedQuery
 * @see docs/DEVELOPMENT_STANDARDS.md for pagination guidelines
 */

import { useInfiniteQuery, type QueryKey, type InfiniteData } from '@tanstack/react-query';

/** Default page size for paginated queries */
export const DEFAULT_PAGE_SIZE = 25;

/** Result type for paginated query functions */
export interface PaginatedResult<T> {
  /** Data items for this page */
  data: T[];
  /** Cursor for fetching next page (null if no more pages) */
  nextCursor: string | null;
  /** Total count if available */
  totalCount?: number;
}

/** Options for usePaginatedQuery hook */
export interface UsePaginatedQueryOptions<T> {
  /** React Query cache key */
  queryKey: QueryKey;
  /** 
   * Query function that receives cursor and returns paginated data.
   * Pass null for first page.
   */
  queryFn: (cursor: string | null) => Promise<PaginatedResult<T>>;
  /** Whether the query is enabled */
  enabled?: boolean;
  /** Number of items per page */
  pageSize?: number;
  /** Stale time override */
  staleTime?: number;
}

/**
 * Hook for paginated data fetching with infinite scroll support.
 * 
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePaginatedQuery({
 *   queryKey: ['leads', accountOwnerId],
 *   queryFn: async (cursor) => {
 *     let query = supabase
 *       .from('leads')
 *       .select('id, name, email')
 *       .eq('user_id', accountOwnerId)
 *       .order('created_at', { ascending: false })
 *       .limit(25);
 *     
 *     if (cursor) {
 *       query = query.lt('created_at', cursor);
 *     }
 *     
 *     const { data, error } = await query;
 *     if (error) throw error;
 *     
 *     return {
 *       data: data || [],
 *       nextCursor: data?.length === 25 ? data.at(-1)?.created_at : null,
 *     };
 *   },
 *   enabled: !!accountOwnerId,
 * });
 * 
 * // Flatten pages for rendering
 * const allItems = data?.pages.flatMap(page => page.data) ?? [];
 * ```
 */
export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime,
}: UsePaginatedQueryOptions<T>) {
  return useInfiniteQuery<
    PaginatedResult<T>,
    Error,
    InfiniteData<PaginatedResult<T>>,
    QueryKey,
    string | null
  >({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled,
    staleTime,
  });
}

/**
 * Helper to flatten infinite query pages into a single array.
 * 
 * @example
 * ```tsx
 * const items = flattenPages(data);
 * ```
 */
export function flattenPages<T>(
  data: InfiniteData<PaginatedResult<T>> | undefined
): T[] {
  return data?.pages.flatMap(page => page.data) ?? [];
}

/**
 * Helper to get total count from paginated data (if available).
 */
export function getTotalCount<T>(
  data: InfiniteData<PaginatedResult<T>> | undefined
): number | undefined {
  return data?.pages[0]?.totalCount;
}
