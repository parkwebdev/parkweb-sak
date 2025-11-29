import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useSearchData, type SearchResult } from '@/hooks/useSearchData';
import * as Icons from '@untitledui/icons';

export const GlobalSearch = () => {
  const { open, setOpen } = useGlobalSearch();
  const { searchResults, loading } = useSearchData();
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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

  // Group results by category
  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

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
        placeholder="Search everything..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupedResults).map(([category, results]) => (
              <CommandGroup key={category} heading={category}>
                {results.map((result) => {
                  const IconComponent = result.iconName ? (Icons as any)[result.iconName] : null;
                  
                  return (
                    <CommandItem
                      key={result.id}
                      value={`${result.title} ${result.description || ''}`}
                      onSelect={() => handleSelect(result)}
                    >
                      {IconComponent && (
                        <IconComponent className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        {result.description && (
                          <span className="text-xs text-muted-foreground">
                            {result.description}
                          </span>
                        )}
                      </div>
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
