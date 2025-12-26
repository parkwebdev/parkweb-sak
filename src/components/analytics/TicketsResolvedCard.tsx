/**
 * TicketsResolvedCard Component
 * 
 * Placeholder card for upcoming tickets feature. Displays "Coming Soon"
 * overlay with description of planned functionality.
 * 
 * @module components/analytics/TicketsResolvedCard
 * @see docs/ANALYTICS_REDESIGN_PLAN.md - Phase 5e
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket02 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import type { TicketsResolvedCardProps } from '@/types/analytics';

/**
 * Renders a placeholder card for the upcoming tickets feature.
 * Shows "Coming Soon" badge and feature description.
 */
export const TicketsResolvedCard = React.memo(function TicketsResolvedCard({
  ticketsResolved,
  comingSoon = true,
  loading = false,
  className,
}: TicketsResolvedCardProps) {
  // If feature is available (not coming soon), render actual data
  if (!comingSoon && typeof ticketsResolved === 'number') {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-base">Tickets Resolved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <Ticket02 size={24} className="text-success" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {ticketsResolved.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                tickets resolved this period
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Coming Soon state (default)
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-muted-foreground">Tickets Resolved</CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">
            Coming Soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-6 text-center opacity-60">
          <div 
            className="w-16 h-16 rounded-full bg-muted/50 border border-dashed border-border flex items-center justify-center mb-4"
            aria-hidden="true"
          >
            <Ticket02 size={28} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Track support tickets resolved by AI and your team.
          </p>
        </div>
      </CardContent>
      {/* Subtle overlay pattern for disabled state */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,hsl(var(--muted)/0.03)_10px,hsl(var(--muted)/0.03)_20px)]"
        aria-hidden="true"
      />
    </Card>
  );
});
