/**
 * Unified Search Component
 * 
 * Command palette for searching across app content.
 * Automatically switches between user and admin search data
 * based on the current route.
 * 
 * @module components/UnifiedSearch
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
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';
import { useSearchData, type SearchResult } from '@/hooks/useSearchData';
import { useAdminSearchData, type AdminSearchResult } from '@/hooks/admin/useAdminSearchData';
import { SkeletonSearchResults } from '@/components/ui/skeleton';
import { File06 } from '@untitledui/icons';
import { NAVIGATION_ICON_MAP } from '@/lib/navigation-icons';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';

/** Union type for both result types */
type UnifiedSearchResult = SearchResult | AdminSearchResult;

/**
 * Unified search command palette component.
 * Switches between user and admin search based on current route.
 */
export function UnifiedSearch() {
  const { open, setOpen, isAdminMode } = useUnifiedSearch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filteredResults, setFilteredResults] = useState<UnifiedSearchResult[]>([]);

  // Conditionally use the appropriate data hook
  const userSearch = useSearchData();
  const adminSearch = useAdminSearchData();

  // Switch data source based on mode
  const { searchResults, loading } = isAdminMode ? adminSearch : userSearch;

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
  }, {} as Record<string, UnifiedSearchResult[]>);

  /**
   * Handle result selection - navigate or execute action
   */
  const handleSelect = (result: UnifiedSearchResult) => {
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
        placeholder={isAdminMode ? 'Search admin...' : 'Type a command or search...'}
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
                  const IconComponent = isAriLogo
                    ? AriAgentsIcon
                    : result.iconName
                      ? NAVIGATION_ICON_MAP[result.iconName]
                      : null;

                  return (
                    <CommandItem
                      key={result.id}
                      value={`${result.title} ${result.description || ''}`}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          {IconComponent ? (
                            <IconComponent className="h-4 w-4 text-muted-foreground" size={16} />
                          ) : (
                            <File06 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
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
}
