import React, { useState, useEffect } from 'react';
import { SearchSm as Search } from '@untitledui/icons';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  action?: () => void;
}

interface GlobalSearchDialogProps {
  searchResults?: SearchResult[];
  onSelect?: (result: SearchResult) => void;
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({
  searchResults = [],
  onSelect
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleValueChange = (newValue: string) => {
    setSearchValue(newValue);
  };

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    result.action?.();
    setOpen(false);
    setSearchValue("");
  };

  const filteredResults = searchValue.length > 0 
    ? searchResults.filter(result =>
        result.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        result.description?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : searchResults;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search or jump to..."
        value={searchValue}
        onValueChange={handleValueChange}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {filteredResults.length > 0 && (
          <CommandGroup heading={searchValue.length > 0 ? "Search Results" : "Quick Actions"}>
            {filteredResults.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer"
              >
                <Search className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.description && (
                    <span className="text-sm text-muted-foreground">
                      {result.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};