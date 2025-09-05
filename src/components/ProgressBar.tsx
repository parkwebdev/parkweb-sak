import React from 'react';

interface ProgressBarProps {
  percentage: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  className = ""
}) => {
  const progressWidth = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div className={`items-center flex min-w-60 w-full gap-3 h-full flex-1 shrink basis-[0%] ${className}`}>
      <div className="self-stretch flex-1 shrink basis-[0%] my-auto">
        <div className="flex flex-col bg-muted rounded-full max-md:pr-5">
          <div
            className="flex shrink-0 h-2 bg-primary rounded-full"
            style={{ width: `${progressWidth * 2.07}px` }}
          />
        </div>
      </div>
      <div className="text-muted-foreground text-sm font-medium leading-5 self-stretch my-auto">
        {percentage}%
      </div>
    </div>
  );
};
