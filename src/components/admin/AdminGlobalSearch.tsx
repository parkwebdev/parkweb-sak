/**
 * Admin Global Search Component
 * 
 * Command palette for searching across admin content including
 * accounts, team members, help articles, and admin sections.
 * Activated via Cmd/Ctrl+K keyboard shortcut when in admin area.
 * 
 * @module components/admin/AdminGlobalSearch
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
import { useAdminGlobalSearch } from '@/hooks/admin/useAdminGlobalSearch';
import { useAdminSearchData, type AdminSearchResult } from '@/hooks/admin/useAdminSearchData';
import { SkeletonSearchResults } from '@/components/ui/skeleton';
import { File06 } from '@untitledui/icons';
import { NAVIGATION_ICON_MAP } from '@/lib/navigation-icons';

/**
 * Admin global search command palette component.
 * Provides unified search across all admin content.
 * 
 * @remarks
 * - Opens with Cmd/Ctrl+K when in /admin/* routes
 * - Groups results by category
 * - Supports navigation to admin sections
 */
export function AdminGlobalSearch() {
  const { open, setOpen } = useAdminGlobalSearch();
  const { searchResults, loading } = useAdminSearchData();
  const [filteredResults, setFilteredResults] = useState<AdminSearchResult[]>([]);
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
  }, {} as Record<string, AdminSearchResult[]>);

  /**
   * Handle result selection - navigate or execute action
   */
  const handleSelect = (result: AdminSearchResult) => {
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
        placeholder="Search admin..."
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
                  const IconComponent = result.iconName 
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
