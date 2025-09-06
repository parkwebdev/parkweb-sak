import React from 'react';

interface ProgressBarProps {
  percentage: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  className = ""
}) => {
  const getProgressColor = (percent: number) => {
    if (percent >= 75) {
      return 'bg-green-500 dark:bg-gradient-to-r dark:from-green-400 dark:to-green-600';
    } else if (percent >= 50) {
      return 'bg-blue-500 dark:bg-gradient-to-r dark:from-blue-400 dark:to-blue-600';
    } else if (percent >= 25) {
      return 'bg-yellow-500 dark:bg-gradient-to-r dark:from-yellow-400 dark:to-yellow-600';
    } else {
      return 'bg-red-500 dark:bg-gradient-to-r dark:from-red-400 dark:to-red-600';
    }
  };

  const progressWidth = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div className={`w-full space-y-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Progress</span>
        <span className="text-xs font-medium text-foreground">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </div>
  );
};
