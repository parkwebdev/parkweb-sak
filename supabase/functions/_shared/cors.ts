/**
 * CORS Headers
 * Standard CORS headers for all edge functions.
 * 
 * @module _shared/cors
 * @description Provides consistent CORS configuration across all edge functions.
 * 
 * @example
 * ```typescript
 * import { corsHeaders } from "../_shared/cors.ts";
 * 
 * // Handle preflight
 * if (req.method === 'OPTIONS') {
 *   return new Response(null, { headers: corsHeaders });
 * }
 * 
 * // Include in response
 * return new Response(JSON.stringify(data), {
 *   headers: { ...corsHeaders, 'Content-Type': 'application/json' }
 * });
 * ```
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
