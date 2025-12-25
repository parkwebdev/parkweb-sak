/**
 * Global Search Component
 * 
 * Command palette for searching across all app content including
 * agents, conversations, leads, and navigation items.
 * Activated via Cmd/Ctrl+K keyboard shortcut.
 * 
 * @module components/GlobalSearch
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useSearchData, type SearchResult } from '@/hooks/useSearchData';
import { SkeletonSearchResults } from '@/components/ui/skeleton';
import * as Icons from '@untitledui/icons';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';

/**
 * Global search command palette component.
 * Provides unified search across all application content.
 * 
 * @remarks
 * - Opens with Cmd/Ctrl+K
 * - Groups results by category
 * - Supports navigation and custom actions
 */
export const GlobalSearch = () => {
  const { open, setOpen } = useGlobalSearch();
  const { searchResults, loading } = useSearchData();
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Filter results based on search query
  useEffect(() => {
    if (!search) {
      setFilteredResults(searchResults);
      return;
    }

    const query = search.toLowerCase();
    const filtered = searchResults.filter(
      (result) =>
        result.title.toLowerCase().includes(query) ||
        result.description?.toLowerCase().includes(query) ||
        result.category.toLowerCase().includes(query)
    );
    setFilteredResults(filtered);
  }, [search, searchResults]);

  // Group results by category for organized display
  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  /**
   * Handle result selection - navigate or execute action
   * @internal
   */
  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.url) {
      navigate(result.url);
    }
    setOpen(false);
    setSearch('');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {loading ? (
          <SkeletonSearchResults items={5} />
        ) : (
          <>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupedResults).map(([category, results]) => (
              <CommandGroup key={category} heading={category}>
              {results.map((result) => {
                  const isAriLogo = result.iconName === 'AriLogo';
                  const IconsRecord = Icons as Record<string, React.ComponentType<{ className?: string }>>;
                  const IconComponent = isAriLogo ? null : (result.iconName ? IconsRecord[result.iconName] : null);
                  
                    return (
                    <CommandItem
                      key={result.id}
                      value={`${result.title} ${result.description || ''}`}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {isAriLogo ? (
                          <AriAgentsIcon className="h-4 w-4 shrink-0 text-muted-foreground" size={16} />
                        ) : IconComponent ? (
                          <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : null}
                        <div className="flex flex-col">
                          <span className="font-medium">{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground">
                              {result.description}
                            </span>
                          )}
                        </div>
                      </div>
                      {result.shortcut && (
                        <CommandShortcut>{result.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};