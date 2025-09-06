import React from 'react';
import { DotsHorizontal as MoreHorizontal, TrendUp01 as TrendingUp, TrendDown01 as TrendingDown } from '@untitledui/icons';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  chartImage: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  chartImage
}) => {
  return (
    <div className="min-w-72 border shadow-sm overflow-hidden flex-1 shrink basis-[0%] bg-card rounded-lg border-border">
      <div className="w-full gap-0.5">
        <div className="items-center flex w-full gap-3 text-xs text-foreground font-medium leading-none pt-2.5 pb-1.5 px-4">
          <div className="text-card-foreground text-xs leading-4 self-stretch flex-1 shrink basis-[0%] my-auto">
            {title}
          </div>
        </div>
        <div className="border shadow-sm relative w-full gap-4 bg-background p-4 rounded-lg border-border">
          <div className="items-center content-center flex-wrap z-0 flex w-full gap-2.5">
            <div className="text-foreground text-2xl font-semibold leading-8 self-stretch my-auto">
              {value}
            </div>
            <div className="items-center self-stretch flex gap-1.5 text-xs font-medium leading-none my-auto">
              <div className={`justify-center items-center self-stretch flex gap-1 whitespace-nowrap text-center my-auto ${
                changeType === 'positive' ? 'text-success' : 'text-destructive'
              }`}>
                {changeType === 'positive' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <div className={`text-xs leading-4 self-stretch my-auto ${
                  changeType === 'positive' ? 'text-success' : 'text-destructive'
                }`}>
                  {change}
                </div>
              </div>
              <div className="text-muted-foreground text-xs leading-4 self-stretch my-auto">
                vs last month
              </div>
            </div>
          </div>
          <img
            src={chartImage}
            className="aspect-[5.43] object-contain w-full max-w-[280px] z-0 mt-3"
            alt="Chart"
          />
          <button className="absolute z-0 w-4 right-4 top-4 hover:bg-accent rounded p-0.5 transition-colors">
            <MoreHorizontal className="w-full h-full text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};
