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
      <div className="items-center border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex w-full gap-2 overflow-hidden bg-white px-3 py-2 rounded-lg border-solid border-[#D5D7DA]">
        <div className="items-center self-stretch flex gap-2 text-base text-[#717680] font-normal flex-1 shrink basis-[0%] my-auto">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/57274afdd1238290026fe0d60710347fbb4f5f8b?placeholderIfAbsent=true"
            className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto"
            alt="Search icon"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="text-[#717680] text-ellipsis text-base leading-6 self-stretch flex-1 shrink basis-[0%] my-auto bg-transparent border-none outline-none"
          />
        </div>
        <div className="rounded border self-stretch flex text-xs text-[#717680] font-medium my-auto px-1 py-px border-solid border-[#E9EAEB]">
          <div className="text-[#717680] text-xs leading-[18px]">
            ⌘K
          </div>
        </div>
      </div>
    </div>
  );
};
