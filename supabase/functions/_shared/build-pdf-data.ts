/**
 * Build PDF Data for Edge Functions
 * 
 * Server-side data fetcher that queries all analytics tables
 * and transforms them into the PDFData format.
 */

import type { PDFData } from './pdf/types.ts';

interface ReportConfig {
  startDate: string;
  endDate: string;
  filters?: {
    agentId?: string;
    locationId?: string;
  };
  includeConversations?: boolean;
  includeLeads?: boolean;
  includeSatisfaction?: boolean;
  includeAIPerformance?: boolean;
  includeTrafficSources?: boolean;
  includeBookings?: boolean;
  includeTopPages?: boolean;
}

/**
 * Fetch and build comprehensive PDF data from all analytics tables
 */
export async function buildPDFDataFromSupabase(
  supabase: any,
  userId: string,
  config: ReportConfig
): Promise<PDFData> {
  const { startDate, endDate, filters } = config;
  
  // Calculate previous period for comparisons
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const periodLength = endMs - startMs;
  const prevStartDate = new Date(startMs - periodLength).toISOString();
  const prevEndDate = startDate;

  // Initialize data object
  const data: PDFData = {};

  // =========================================================================
  // CONVERSATIONS
  // =========================================================================
  
  let convQuery = supabase
    .from('conversations')
    .select('id, created_at, status, agent_id')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (filters?.agentId && filters.agentId !== 'all') {
    convQuery = convQuery.eq('agent_id', filters.agentId);
  }

  const { data: conversations } = await convQuery;
  
  // Previous period conversations for comparison
  let prevConvQuery = supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', prevStartDate)
    .lt('created_at', prevEndDate);

  if (filters?.agentId && filters.agentId !== 'all') {
    prevConvQuery = prevConvQuery.eq('agent_id', filters.agentId);
  }

  const { data: prevConversations } = await prevConvQuery;

  const totalConversations = conversations?.length || 0;
  const prevTotalConversations = prevConversations?.length || 0;
  const conversationsChange = prevTotalConversations > 0 
    ? ((totalConversations - prevTotalConversations) / prevTotalConversations) * 100 
    : 0;

  data.totalConversations = totalConversations;
  data.conversationsChange = conversationsChange;

  // Group conversations by date for trend
  if (conversations?.length) {
    const byDate = new Map<string, { total: number; active: number; closed: number }>();
    
    for (const conv of conversations) {
      const date = conv.created_at.split('T')[0];
      const existing = byDate.get(date) || { total: 0, active: 0, closed: 0 };
      existing.total++;
      if (conv.status === 'active' || conv.status === 'human_takeover') {
        existing.active++;
      } else {
        existing.closed++;
      }
      byDate.set(date, existing);
    }

    data.conversationStats = Array.from(byDate.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // =========================================================================
  // LEADS
  // =========================================================================
  
  const { data: leads } = await supabase
    .from('leads')
    .select('id, created_at, status, data')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const { data: prevLeads } = await supabase
    .from('leads')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', prevStartDate)
    .lt('created_at', prevEndDate);

  const totalLeads = leads?.length || 0;
  const prevTotalLeads = prevLeads?.length || 0;
  const leadsChange = prevTotalLeads > 0 
    ? ((totalLeads - prevTotalLeads) / prevTotalLeads) * 100 
    : 0;

  data.totalLeads = totalLeads;
  data.leadsChange = leadsChange;
  data.conversionRate = totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0;

  // Lead stats by date
  if (leads?.length) {
    const byDate = new Map<string, number>();
    for (const lead of leads) {
      const date = lead.created_at.split('T')[0];
      byDate.set(date, (byDate.get(date) || 0) + 1);
    }
    data.leadStats = Array.from(byDate.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Lead source breakdown
    const bySource = new Map<string, { leads: number; sessions: number }>();
    for (const lead of leads) {
      const source = lead.data?.source || lead.data?.utm_source || 'Direct';
      const existing = bySource.get(source) || { leads: 0, sessions: 0 };
      existing.leads++;
      existing.sessions++;
      bySource.set(source, existing);
    }
    data.leadSourceBreakdown = Array.from(bySource.entries())
      .map(([source, stats]) => ({
        source,
        leads: stats.leads,
        sessions: stats.sessions,
        cvr: stats.sessions > 0 ? (stats.leads / stats.sessions) * 100 : 0,
      }))
      .sort((a, b) => b.leads - a.leads);
  }

  // =========================================================================
  // SATISFACTION RATINGS
  // =========================================================================
  
  const conversationIds = (conversations || []).map((c: any) => c.id).filter(Boolean);
  
  if (conversationIds.length > 0) {
    const { data: ratings } = await supabase
      .from('conversation_ratings')
      .select('rating, feedback, created_at, trigger_type, conversation_id')
      .in('conversation_id', conversationIds);

    if (ratings?.length) {
      const totalRatings = ratings.length;
      const avgRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings;
      
      // Distribution
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratings.filter((r: any) => r.rating === rating).length,
      }));

      data.satisfactionStats = {
        average_rating: avgRating,
        total_ratings: totalRatings,
        distribution,
      };

      data.csatDistribution = distribution.map(d => ({
        ...d,
        percentage: Math.round((d.count / totalRatings) * 100),
      }));

      // Recent feedback
      data.recentFeedback = ratings
        .filter((r: any) => r.feedback)
        .slice(0, 10)
        .map((r: any) => ({
          rating: r.rating,
          feedback: r.feedback,
          createdAt: r.created_at,
          triggerType: r.trigger_type,
        }));
    }
  }

  // =========================================================================
  // AI PERFORMANCE (from conversation takeovers)
  // =========================================================================
  
  if (conversationIds.length > 0) {
    const { data: takeovers } = await supabase
      .from('conversation_takeovers')
      .select('conversation_id')
      .in('conversation_id', conversationIds);

    const humanTakeover = takeovers?.length || 0;
    const aiHandled = totalConversations - humanTakeover;
    const containmentRate = totalConversations > 0 ? Math.round((aiHandled / totalConversations) * 100) : 0;
    
    data.aiPerformanceStats = {
      containment_rate: containmentRate,
      resolution_rate: containmentRate, // Same as containment for now
      ai_handled: aiHandled,
      human_takeover: humanTakeover,
      total_conversations: totalConversations,
    };
  }

  // =========================================================================
  // BOOKINGS (from calendar_events)
  // =========================================================================
  
  const { data: bookings } = await supabase
    .from('calendar_events')
    .select('id, status, start_time, location_id, locations(name)')
    .gte('start_time', startDate)
    .lte('start_time', endDate);

  if (bookings?.length) {
    // Group by location
    const byLocation = new Map<string, { total: number; confirmed: number; completed: number; cancelled: number; noShow: number }>();
    
    for (const booking of bookings) {
      const locationName = booking.locations?.name || 'Unknown';
      const existing = byLocation.get(locationName) || { total: 0, confirmed: 0, completed: 0, cancelled: 0, noShow: 0 };
      existing.total++;
      
      switch (booking.status) {
        case 'confirmed': existing.confirmed++; break;
        case 'completed': existing.completed++; break;
        case 'cancelled': existing.cancelled++; break;
        case 'no_show': existing.noShow++; break;
      }
      
      byLocation.set(locationName, existing);
    }

    data.bookingStats = Array.from(byLocation.entries()).map(([location, stats]) => ({
      location,
      total: stats.total,
      confirmed: stats.confirmed,
      completed: stats.completed,
      no_show: stats.noShow,
      show_rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));

    // Booking trend by date
    const byDate = new Map<string, { confirmed: number; completed: number; cancelled: number; noShow: number }>();
    for (const booking of bookings) {
      const date = booking.start_time.split('T')[0];
      const existing = byDate.get(date) || { confirmed: 0, completed: 0, cancelled: 0, noShow: 0 };
      
      switch (booking.status) {
        case 'confirmed': existing.confirmed++; break;
        case 'completed': existing.completed++; break;
        case 'cancelled': existing.cancelled++; break;
        case 'no_show': existing.noShow++; break;
      }
      
      byDate.set(date, existing);
    }

    data.bookingTrend = Array.from(byDate.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // =========================================================================
  // TRAFFIC SOURCES (from conversation metadata)
  // =========================================================================
  
  if (conversations?.length) {
    // Get conversation metadata for traffic sources
    const { data: convWithMeta } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('metadata', 'is', null);

    if (convWithMeta?.length) {
      const bySource = new Map<string, number>();
      
      for (const conv of convWithMeta) {
        const source = conv.metadata?.source || conv.metadata?.referrer || 'Direct';
        const normalizedSource = source.toLowerCase().includes('google') ? 'Organic'
          : source.toLowerCase().includes('facebook') || source.toLowerCase().includes('instagram') ? 'Social'
          : source.toLowerCase().includes('email') ? 'Email'
          : source === 'Direct' ? 'Direct'
          : 'Referral';
        
        bySource.set(normalizedSource, (bySource.get(normalizedSource) || 0) + 1);
      }

      const totalVisitors = Array.from(bySource.values()).reduce((a, b) => a + b, 0);
      data.trafficSources = Array.from(bySource.entries())
        .map(([source, visitors]) => ({
          source,
          visitors,
          percentage: totalVisitors > 0 ? Math.round((visitors / totalVisitors) * 100) : 0,
        }))
        .sort((a, b) => b.visitors - a.visitors);
    }
  }

  // =========================================================================
  // LOCATIONS (from conversation metadata)
  // =========================================================================
  
  if (conversations?.length) {
    const { data: convWithLocation } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('metadata->country', 'is', null);

    if (convWithLocation?.length) {
      const byCountry = new Map<string, number>();
      const byCity = new Map<string, { city: string; country: string; count: number }>();
      
      for (const conv of convWithLocation) {
        const country = conv.metadata?.country || 'Unknown';
        const city = conv.metadata?.city;
        
        byCountry.set(country, (byCountry.get(country) || 0) + 1);
        
        if (city) {
          const key = `${city}-${country}`;
          const existing = byCity.get(key) || { city, country, count: 0 };
          existing.count++;
          byCity.set(key, existing);
        }
      }

      const totalVisitors = Array.from(byCountry.values()).reduce((a, b) => a + b, 0);
      data.visitorLocations = Array.from(byCountry.entries())
        .map(([country, visitors]) => ({
          country,
          visitors,
          percentage: totalVisitors > 0 ? Math.round((visitors / totalVisitors) * 100) : 0,
        }))
        .sort((a, b) => b.visitors - a.visitors);

      data.visitorCities = Array.from(byCity.values())
        .map(c => ({ city: c.city, country: c.country, visitors: c.count }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 20);
    }
  }

  console.log(`[buildPDFData] Built data: ${totalConversations} convos, ${totalLeads} leads, ${data.bookingStats?.length || 0} locations with bookings`);

  return data;
}
