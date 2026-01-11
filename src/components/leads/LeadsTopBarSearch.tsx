/**
 * @fileoverview Leads TopBar Search Component
 * 
 * Encapsulates search state and results rendering for the Leads page.
 * Manages its own search query state to prevent parent re-renders.
 * 
 * @module components/leads/LeadsTopBarSearch
 */

import { useState, useCallback, memo } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';
import { LeadsSearchResults } from './LeadsSearchResults';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;

interface LeadsTopBarSearchProps {
  /** All leads to search through */
  leads: Lead[];
  /** Stage definitions for status indicators */
  stages: Array<{ id: string; name: string; color: string }>;
  /** Callback when a lead is selected from search results */
  onSelect: (lead: Lead) => void;
}

/**
 * Self-contained search component for the Leads page.
 * Manages search state internally to avoid triggering parent re-renders.
 */
export const LeadsTopBarSearch = memo(function LeadsTopBarSearch({
  leads,
  stages,
  onSelect,
}: LeadsTopBarSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const renderResults = useCallback((query: string) => (
    <LeadsSearchResults
      query={query}
      leads={leads}
      stages={stages}
      onSelect={onSelect}
    />
  ), [leads, stages, onSelect]);

  return (
    <TopBarSearch
      placeholder="Search leads..."
      value={searchQuery}
      onChange={setSearchQuery}
      renderResults={renderResults}
    />
  );
});
