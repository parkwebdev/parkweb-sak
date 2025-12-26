import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export function useMapboxToken() {
  return useQuery({
    queryKey: ["mapbox-token"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-mapbox-token");
      
      if (error) {
        logger.error("Failed to fetch Mapbox token:", error);
        throw error;
      }
      
      if (!data?.token) {
        throw new Error("Mapbox token not returned");
      }
      
      return data.token as string;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 2,
  });
}
