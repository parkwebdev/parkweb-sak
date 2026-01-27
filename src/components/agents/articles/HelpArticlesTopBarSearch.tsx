/**
 * @fileoverview Help Articles TopBar Search Component
 * 
 * Encapsulates search input for the Help Articles section.
 * Renders in the TopBar center slot, filters the data table.
 * 
 * @module components/agents/articles/HelpArticlesTopBarSearch
 */

import { memo } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';

interface HelpArticlesTopBarSearchProps {
  /** Current global filter value from parent */
  value: string;
  /** Callback when search changes */
  onChange: (value: string) => void;
}

/**
 * Search component for the Help Articles section TopBar.
 * No popover/dropdown - just filters the data table directly.
 */
export const HelpArticlesTopBarSearch = memo(function HelpArticlesTopBarSearch({
  value,
  onChange,
}: HelpArticlesTopBarSearchProps) {
  return (
    <TopBarSearch
      placeholder="Search articles..."
      value={value}
      onChange={onChange}
      showPopover={false}
      className="w-48 lg:w-64"
    />
  );
});
