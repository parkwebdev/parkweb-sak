/**
 * @fileoverview Leads Search Results Component
 * 
 * Renders lead search results for the TopBarSearch dropdown.
 * 
 * @module components/leads/LeadsSearchResults
 */

import React from 'react';
import { User01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;

interface LeadsSearchResultsProps {
  /** Filtered leads to display */
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
 */
export function LeadsSearchResults({
  leads,
  onSelect,
  stages = [],
  maxResults = 10,
}: LeadsSearchResultsProps) {
  if (leads.length === 0) {
    return <TopBarSearchEmptyState message="No leads found" />;
  }

  return (
    <>
      {leads.slice(0, maxResults).map((lead) => {
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
