import React from 'react';
import { SearchSm as Search } from '@untitledui/icons';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
}

interface SimpleSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  searchResults?: SearchResult[];
}

export const SimpleSearch: React.FC<SimpleSearchProps> = ({
  placeholder = "Search",
  value = "",
  onChange,
  className = "",
}) => {
  return (
    <div className={`w-full gap-1.5 ${className}`}>
      <div className="items-center border shadow-sm flex w-full gap-2 overflow-hidden bg-background px-3 py-2 rounded-lg border-border hover:bg-accent/50 transition-colors">
        <div className="items-center self-stretch flex gap-2 text-sm text-muted-foreground font-normal flex-1 shrink basis-[0%] my-auto">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="text-foreground text-ellipsis text-xs leading-4 self-stretch flex-1 shrink basis-[0%] my-auto bg-transparent border-none outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
};