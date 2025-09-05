import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'folder' | 'online';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = ""
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'folder':
        return "items-center border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex gap-1 bg-white px-1.5 py-0.5 rounded-md border-solid border-[#D5D7DA]";
      case 'online':
        return "items-center border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex gap-1 text-xs text-[#414651] font-medium whitespace-nowrap text-center bg-white px-1.5 py-0.5 rounded-md border-solid border-[#D5D7DA]";
      default:
        return "items-center border flex text-xs text-[#414651] font-medium whitespace-nowrap text-center bg-neutral-50 px-2 py-0.5 rounded-full border-solid border-[#E9EAEB]";
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {children}
    </div>
  );
};
