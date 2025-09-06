import React from 'react';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="min-w-80 border shadow-sm overflow-hidden flex-1 shrink basis-[0%] bg-card rounded-xl border-border">
      <div className="w-full gap-0.5">
        <div className="items-center flex w-full gap-4 text-sm text-foreground font-semibold leading-none pt-3 pb-2 px-5">
          <div className="text-card-foreground text-sm leading-5 self-stretch flex-1 shrink basis-[0%] my-auto">
            {title}
          </div>
        </div>
        <div className="border shadow-sm relative w-full gap-5 bg-background p-5 rounded-xl border-border">
          <div className="items-center content-center flex-wrap z-0 flex w-full gap-3">
            <div className="text-foreground text-3xl font-semibold leading-[38px] self-stretch my-auto">
              {value}
            </div>
            <div className="items-center self-stretch flex gap-2 text-sm font-medium leading-none my-auto">
              <div className={`justify-center items-center self-stretch flex gap-1 whitespace-nowrap text-center my-auto ${
                changeType === 'positive' ? 'text-success' : 'text-destructive'
              }`}>
                {changeType === 'positive' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <div className={`text-sm leading-5 self-stretch my-auto ${
                  changeType === 'positive' ? 'text-success' : 'text-destructive'
                }`}>
                  {change}
                </div>
              </div>
              <div className="text-muted-foreground text-sm leading-5 self-stretch my-auto">
                vs last month
              </div>
            </div>
          </div>
          <img
            src={chartImage}
            className="aspect-[5.43] object-contain w-[304px] z-0 mt-5"
            alt="Chart"
          />
          <button className="absolute z-0 w-5 right-5 top-5 hover:bg-accent rounded p-1 transition-colors">
            <MoreHorizontal className="w-full h-full text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};
