/**
 * ReportFilters Component
 * 
 * Filter controls for analytics reports including agent and date selection.
 * Provides consistent filtering interface across analytics views.
 * @module components/analytics/ReportFilters
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAgents } from '@/hooks/useAgents';

export interface ReportFilters {
  agentId: string;
  leadStatus: string;
  conversationStatus: string;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
}

export const ReportFiltersPanel = ({ filters, onFiltersChange }: ReportFiltersProps) => {
  const { agents } = useAgents();

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Agent</label>
            <Select value={filters.agentId} onValueChange={(v) => updateFilter('agentId', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Lead Status</label>
            <Select value={filters.leadStatus} onValueChange={(v) => updateFilter('leadStatus', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Conversation Status</label>
            <Select value={filters.conversationStatus} onValueChange={(v) => updateFilter('conversationStatus', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="human_takeover">Human Takeover</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
