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
    <div className={`w-full space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Progress</span>
        <span className="text-xs font-medium text-foreground">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className="bg-success h-1.5 rounded-full transition-all duration-300" 
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </div>
  );
};
