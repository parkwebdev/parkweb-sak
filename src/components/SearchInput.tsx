import React, { useState, useEffect } from 'react';
import { SearchSm as Search, Calendar, User01 as User, File05 as FileText, Mail01 as Mail, Bell01 as Bell, Settings01 as Settings, ChevronRight } from '@untitledui/icons';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useSearchData } from '@/hooks/useSearchData';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  action?: () => void;
}

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  searchResults?: SearchResult[];
  onSelect?: (result: SearchResult) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search everything...",
  className = "",
}) => {
  const { open, setOpen } = useGlobalSearch();
  const { searchResults, loading } = useSearchData();
  const [searchValue, setSearchValue] = useState('');

  const handleValueChange = (newValue: string) => {
    setSearchValue(newValue);
  };

  const handleSelect = (result: SearchResult) => {
    result.action?.();
    setOpen(false);
    setSearchValue('');
  };

  const filteredResults = searchValue.length > 0 
    ? searchResults.filter(result =>
        result.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        result.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
        result.category?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : searchResults;

  // Group results by category
  const groupedResults = filteredResults.reduce((acc, result) => {
    const category = result.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Navigation':
        return ChevronRight;
      case 'Agents':
        return FileText;
      case 'Conversations':
        return Mail;
      case 'Leads':
        return User;
      case 'Team':
        return User;
      case 'Notifications':
        return Bell;
      case 'Quick Actions':
        return Settings;
      default:
        return Search;
    }
  };

  const priorityOrder = ['Navigation', 'Quick Actions', 'Agents', 'Conversations', 'Leads', 'Team', 'Notifications'];
  const sortedCategories = Object.keys(groupedResults).sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a);
    const bIndex = priorityOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <>
      <div 
        className={`w-full gap-1.5 ${className}`}
        onClick={() => setOpen(true)}
      >
        <div className="items-center border shadow-sm flex w-full gap-2 overflow-hidden bg-background px-3 py-2 rounded-lg border-border cursor-pointer hover:bg-accent/50 transition-colors">
          <div className="items-center self-stretch flex gap-2 text-sm text-muted-foreground font-normal flex-1 shrink min-w-0 my-auto">
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value=""
              placeholder={placeholder}
              className="text-foreground text-ellipsis text-xs leading-4 self-stretch flex-1 shrink min-w-0 my-auto bg-transparent border-none outline-none placeholder:text-muted-foreground cursor-pointer"
              readOnly
            />
          </div>
          <div className="rounded border flex items-center justify-center text-xs text-muted-foreground font-medium px-1.5 py-0.5 border-border min-w-[28px] whitespace-nowrap flex-shrink-0">
            <span className="text-muted-foreground text-xs leading-none">
              ⌘K
            </span>
          </div>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={placeholder}
          value={searchValue}
          onValueChange={handleValueChange}
        />
        <CommandList>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <>
              {filteredResults.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : (
                sortedCategories.map(category => {
                  const categoryResults = groupedResults[category];
                  const CategoryIcon = getCategoryIcon(category);
                  
                  return (
                    <CommandGroup key={category} heading={category}>
                      {categoryResults.slice(0, category === 'Navigation' ? 10 : 5).map((result) => (
                        <CommandItem
                          key={result.id}
                          onSelect={() => handleSelect(result)}
                          className="cursor-pointer"
                        >
                          <CategoryIcon className="mr-2 h-4 w-4" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="truncate">{result.title}</span>
                            {result.description && (
                              <span className="text-sm text-muted-foreground truncate">
                                {result.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
