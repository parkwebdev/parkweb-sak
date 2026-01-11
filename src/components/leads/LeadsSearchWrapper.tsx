/**
 * @fileoverview Leads Search Wrapper
 * 
 * Self-contained wrapper that fetches leads and stages internally,
 * preventing data dependencies from propagating to parent TopBar config.
 * 
 * @module components/leads/LeadsSearchWrapper
 */

import { memo, useRef, useEffect, useCallback } from 'react';
import { useInfiniteLeads } from '@/hooks/useInfiniteLeads';
import { useLeadStages } from '@/hooks/useLeadStages';
import { LeadsTopBarSearch } from './LeadsTopBarSearch';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;

interface LeadsSearchWrapperProps {
  /** Callback when a lead is selected from search results */
  onSelect: (lead: Lead) => void;
}

/**
 * Wrapper component that fetches its own data to isolate
 * data dependencies from the parent's TopBar config.
 */
export const LeadsSearchWrapper = memo(function LeadsSearchWrapper({
  onSelect,
}: LeadsSearchWrapperProps) {
  const { leads } = useInfiniteLeads();
  const { stages } = useLeadStages();
  
  // Keep onSelect stable via ref
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  
  const handleSelect = useCallback((lead: Lead) => {
    onSelectRef.current(lead);
  }, []);
  
  // Transform stages for the search component
  const stagesForSearch = stages.map(s => ({ id: s.id, name: s.name, color: s.color }));
  
  return (
    <LeadsTopBarSearch
      leads={leads}
      stages={stagesForSearch}
      onSelect={handleSelect}
    />
  );
});
