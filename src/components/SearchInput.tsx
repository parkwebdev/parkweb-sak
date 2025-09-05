import React from 'react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search",
  value = "",
  onChange,
  className = ""
}) => {
  return (
    <div className={`w-full gap-1.5 ${className}`}>
      <div className="items-center border shadow-sm flex w-full gap-2 overflow-hidden bg-background px-3 py-2 rounded-lg border-border">
        <div className="items-center self-stretch flex gap-2 text-base text-muted-foreground font-normal flex-1 shrink basis-[0%] my-auto">
          <span className="text-muted-foreground">🔍</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="text-muted-foreground text-ellipsis text-base leading-6 self-stretch flex-1 shrink basis-[0%] my-auto bg-transparent border-none outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="rounded border self-stretch flex text-xs text-muted-foreground font-medium my-auto px-1 py-px border-border">
          <div className="text-muted-foreground text-xs leading-[18px]">
            ⌘K
          </div>
        </div>
      </div>
    </div>
  );
};
