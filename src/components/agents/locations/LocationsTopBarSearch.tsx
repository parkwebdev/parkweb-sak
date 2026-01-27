/**
 * @fileoverview Locations TopBar Search Component
 * 
 * Encapsulates search input for the Ari Locations section.
 * Renders in the TopBar center slot, filters the data table.
 * 
 * @module components/agents/locations/LocationsTopBarSearch
 */

import { memo } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';

interface LocationsTopBarSearchProps {
  /** Current global filter value from parent */
  value: string;
  /** Callback when search changes */
  onChange: (value: string) => void;
  /** Placeholder based on view mode */
  placeholder?: string;
}

/**
 * Search component for the Locations section TopBar.
 * No popover/dropdown - just filters the data table directly.
 */
export const LocationsTopBarSearch = memo(function LocationsTopBarSearch({
  value,
  onChange,
  placeholder = 'Search...',
}: LocationsTopBarSearchProps) {
  return (
    <TopBarSearch
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      showPopover={false}
      className="w-48 lg:w-64"
    />
  );
});
