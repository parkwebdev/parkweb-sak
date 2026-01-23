/**
 * useSessions Hook
 * 
 * Fetches and manages user sessions from the backend.
 * Provides session listing, revocation, and sign-out functionality.
 * 
 * @module hooks/useSessions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { queryKeys } from '@/lib/query-keys';
import type { SessionData } from '@/components/data-table/columns/sessions-columns';

/** Error returned when edge function fails */
export interface SessionsError {
  status?: number;
  message: string;
}

interface RawSessionData {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
}

interface SessionsResponse {
  sessions: RawSessionData[];
  current_session_id: string | null;
}

/**
 * Parse user agent string to extract device, browser, and OS info
 */
function parseUserAgent(ua: string | null): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'Unknown', browser: 'Unknown Browser', os: 'Unknown' };
  
  // Device detection
  let device = 'Desktop';
  if (/Mobile|Android|iPhone|iPod/i.test(ua) && !/iPad|Tablet/i.test(ua)) {
    device = 'Mobile';
  } else if (/iPad|Tablet/i.test(ua)) {
    device = 'Tablet';
  }
  
  // Browser detection
  let browser = 'Unknown Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('CriOS')) {
    browser = 'Safari';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  } else if (ua.includes('OPR') || ua.includes('Opera')) {
    browser = 'Opera';
  } else if (ua.includes('CriOS')) {
    browser = 'Chrome (iOS)';
  } else if (ua.includes('FxiOS')) {
    browser = 'Firefox (iOS)';
  }
  
  // OS detection
  let os = 'Unknown';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
    os = 'macOS';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Linux') && !ua.includes('Android')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
    os = 'iOS';
  } else if (ua.includes('CrOS')) {
    os = 'Chrome OS';
  }
  
  return { device, browser, os };
}

export function useSessions() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading, error, refetch } = useQuery<SessionData[], SessionsError>({
    queryKey: queryKeys.sessions.list(user?.id || ''),
    queryFn: async (): Promise<SessionData[]> => {
      // Explicitly pass the JWT token to handle iframe/preview environments
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw { status: 401, message: 'No access token available' } as SessionsError;
      }

      const { data, error } = await supabase.functions.invoke<SessionsResponse>('list-user-sessions', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        throw { status: (error as { status?: number }).status || 500, message: getErrorMessage(error) } as SessionsError;
      }
      if (!data?.sessions) return [];
      
      // Enrich sessions with parsed user agent data
      return data.sessions.map(session => ({
        ...session,
        ...parseUserAgent(session.user_agent),
      }));
    },
    enabled: !!session?.access_token,
    staleTime: 30_000, // 30 seconds
  });

  const revokeOthersMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      toast.success('Signed out of other devices', {
        description: 'All other sessions have been terminated.',
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to sign out other sessions', { description: getErrorMessage(error) });
    },
  });

  return {
    sessions,
    isLoading,
    error,
    refetch,
    revokeOthers: revokeOthersMutation.mutate,
    isRevokingOthers: revokeOthersMutation.isPending,
  };
}
