/**
 * Supabase Client Type Definitions
 * Provides type-safe Supabase client type for edge functions.
 * 
 * @module _shared/types/supabase
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Type-safe Supabase client type.
 * Use this instead of `any` for supabase client parameters.
 * 
 * @example
 * ```typescript
 * import type { SupabaseClientType } from '../_shared/types/supabase.ts';
 * 
 * async function fetchData(supabase: SupabaseClientType) {
 *   const { data } = await supabase.from('table').select('*');
 *   return data;
 * }
 * ```
 */
// Using any for the generic params since we don't have generated types in edge functions
// deno-lint-ignore no-explicit-any
export type SupabaseClientType = SupabaseClient<any, 'public', any>;
