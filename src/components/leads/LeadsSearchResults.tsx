/**
 * @fileoverview Leads Search Results Component
 * 
 * Renders lead search results for the TopBarSearch dropdown.
 * Filters leads internally based on query to avoid parent re-renders.
 * 
 * @module components/leads/LeadsSearchResults
 */

import React, { useMemo } from 'react';
import { User01 } from '@untitledui/icons';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;

interface LeadsSearchResultsProps {
  /** Search query to filter leads */
  query: string;
  /** All leads to search through */
  leads: Lead[];
  /** Callback when a lead is selected */
  onSelect: (lead: Lead) => void;
  /** Lead stages for status indicator */
  stages?: Array<{ id: string; name: string; color: string }>;
  /** Maximum number of results to show (default: 10) */
  maxResults?: number;
}

/**
 * Renders lead search results in the TopBarSearch dropdown.
 * Filters leads internally to avoid memoization issues in parent.
 */
export function LeadsSearchResults({
  query,
  leads,
  onSelect,
  stages = [],
  maxResults = 10,
}: LeadsSearchResultsProps) {
  // Filter leads based on query - done here to avoid parent re-renders
  const filteredLeads = useMemo(() => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase();
    return leads.filter((lead) => 
      lead.name?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.phone?.toLowerCase().includes(q) ||
      lead.company?.toLowerCase().includes(q)
    ).slice(0, maxResults);
  }, [query, leads, maxResults]);

  if (filteredLeads.length === 0) {
    return <TopBarSearchEmptyState message="No leads found" />;
  }

  return (
    <>
      {filteredLeads.map((lead) => {
        const stage = stages.find(s => s.id === lead.stage_id);
        
        return (
          <TopBarSearchResultItem
            key={lead.id}
            icon={<User01 size={16} />}
            title={lead.name || lead.email || 'Unnamed Lead'}
            subtitle={[lead.email, lead.company].filter(Boolean).join(' • ')}
            onClick={() => onSelect(lead)}
            statusIndicator={
              stage ? (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: stage.color }}
                />
              ) : null
            }
          />
        );
      })}
    </>
  );
}
