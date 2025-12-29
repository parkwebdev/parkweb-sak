/**
 * ConversationFunnelCard Component
 * 
 * Funnel visualization showing where users drop off in conversations:
 * Started → Engaged → Lead Captured → Booked → Resolved
 * 
 * @module components/analytics/ConversationFunnelCard
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendDown01, MessageChatCircle } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { FunnelStage } from '@/types/analytics';
import { ChartCardHeader } from './ChartCardHeader';

interface ConversationFunnelCardProps {
  stages: FunnelStage[];
  loading?: boolean;
  className?: string;
}

export const ConversationFunnelCard = React.memo(function ConversationFunnelCard({
  stages,
  loading = false,
  className,
}: ConversationFunnelCardProps) {
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalStarted = stages[0]?.count ?? 0;

  if (totalStarted === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <ChartCardHeader
            title="Conversation Funnel"
            contextSummary="Funnel analysis will appear once conversations are recorded"
          />
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageChatCircle size={24} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Funnel analysis will appear once conversations are recorded.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max width based on first stage count for scaling
  const maxCount = stages[0]?.count || 1;

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Conversation Funnel"
          contextSummary={`${totalStarted.toLocaleString()} conversations analyzed`}
        />

        <div className="space-y-3">
          {stages.map((stage, index) => {
            const widthPercentage = (stage.count / maxCount) * 100;
            const animationDelay = prefersReducedMotion ? 0 : index * 80;
            const showDropOff = index > 0 && index < stages.length - 1 && stage.dropOffPercent > 0;

            return (
              <div
                key={stage.name}
                className="flex items-center gap-3 group animate-fade-in"
                style={{ animationDelay: `${animationDelay}ms` }}
              >
                {/* Stage label */}
                <span className="text-sm text-muted-foreground w-28 text-right shrink-0 group-hover:text-foreground transition-colors">
                  {stage.name}
                </span>

                {/* Bar with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 h-8 relative overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-300 group-hover:opacity-90"
                        style={{
                          width: `${Math.max(widthPercentage, stage.count > 0 ? 4 : 0)}%`,
                          backgroundColor: stage.color,
                          animation: prefersReducedMotion ? 'none' : `growWidth 600ms ease-out ${animationDelay}ms both`,
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <div className="space-y-1">
                      <p className="font-medium text-xs">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{stage.count.toLocaleString()}</span> conversations
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stage.percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Count and drop-off indicator */}
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({stage.percentage.toFixed(0)}%)
                  </span>
                  {showDropOff && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-0.5 text-destructive">
                          <TrendDown01 size={12} />
                          <span className="text-xs tabular-nums">{stage.dropOffPercent.toFixed(0)}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">{stage.dropOffPercent.toFixed(1)}% drop from previous stage</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
});
