import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
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

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  searchResults?: SearchResult[];
  onSelect?: (result: SearchResult) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search",
  value = "",
  onChange,
  className = "",
  searchResults = [],
  onSelect
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

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
    onChange?.(newValue);
    
    // Show dialog when user starts typing, but only if not already open
    if (newValue.length > 0 && !open) {
      setOpen(true);
    }
    // Close dialog when search is cleared
    if (newValue.length === 0) {
      setOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    result.action?.();
    setOpen(false);
  };

  const filteredResults = searchResults.filter(result =>
    result.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    result.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <div 
        className={`w-full gap-1.5 ${className}`}
        onClick={() => setOpen(true)}
      >
        <div className="items-center border shadow-sm flex w-full gap-2 overflow-hidden bg-background px-3 py-2 rounded-lg border-border cursor-pointer hover:bg-accent/50 transition-colors">
          <div className="items-center self-stretch flex gap-2 text-sm text-muted-foreground font-normal flex-1 shrink basis-[0%] my-auto">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={placeholder}
              className="text-foreground text-ellipsis text-sm leading-5 self-stretch flex-1 shrink basis-[0%] my-auto bg-transparent border-none outline-none placeholder:text-muted-foreground cursor-pointer"
              readOnly
            />
          </div>
          <div className="rounded border flex items-center justify-center text-xs text-muted-foreground font-medium px-1.5 py-0.5 border-border min-w-[28px]">
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
          <CommandEmpty>No results found.</CommandEmpty>
          {filteredResults.length > 0 && (
            <CommandGroup heading="Results">
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
    </>
  );
};
