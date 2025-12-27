/**
 * ReportBuilder Component
 * 
 * Configuration interface for building custom analytics reports.
 * Allows selection of metrics, date ranges, and report format.
 * @module components/analytics/ReportBuilder
 */

import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ReportConfig {
  type: 'summary' | 'detailed' | 'comparison';
  // Core Metrics
  includeConversations: boolean;
  includeLeads: boolean;
  includeUsageMetrics: boolean;
  // Business Outcomes
  includeBookings: boolean;
  includeSatisfaction: boolean;
  includeAIPerformance: boolean;
  // Traffic Analytics
  includeTrafficSources: boolean;
  includeTopPages: boolean;
  includeVisitorLocations: boolean;
  // Agent Data
  includeAgentPerformance: boolean;
  // Grouping & Export Options
  grouping: 'day' | 'week' | 'month';
  includeKPIs: boolean;
  includeCharts: boolean;
  includeTables: boolean;
}

interface ReportBuilderProps {
  config: ReportConfig;
  onConfigChange: (config: ReportConfig) => void;
}

export const ReportBuilder = ({ config, onConfigChange }: ReportBuilderProps) => {
  const updateConfig = <K extends keyof ReportConfig>(key: K, value: ReportConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <Card className="h-full">
      <CardContent className="pt-6 space-y-6">
        {/* Report Type */}
        <div className="space-y-3">
          <Label className="text-base">Report Type</Label>
          <RadioGroup value={config.type} onValueChange={(v) => updateConfig('type', v as ReportConfig['type'])}>
            <RadioGroupItem value="summary">Summary - High-level overview</RadioGroupItem>
            <RadioGroupItem value="detailed">Detailed - Complete data analysis</RadioGroupItem>
            <RadioGroupItem value="comparison">Comparison - Period over period</RadioGroupItem>
          </RadioGroup>
        </div>

        {/* Core Metrics */}
        <div className="space-y-3">
          <Label className="text-base">Core Metrics</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="conversations"
                checked={config.includeConversations}
                onCheckedChange={(checked) => updateConfig('includeConversations', !!checked)}
              />
              <Label htmlFor="conversations" className="font-normal">Conversations</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="leads"
                checked={config.includeLeads}
                onCheckedChange={(checked) => updateConfig('includeLeads', !!checked)}
              />
              <Label htmlFor="leads" className="font-normal">Leads</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="usage"
                checked={config.includeUsageMetrics}
                onCheckedChange={(checked) => updateConfig('includeUsageMetrics', !!checked)}
              />
              <Label htmlFor="usage" className="font-normal">Usage Metrics</Label>
            </div>
          </div>
        </div>

        {/* Business Outcomes */}
        <div className="space-y-3">
          <Label className="text-base">Business Outcomes</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bookings"
                checked={config.includeBookings}
                onCheckedChange={(checked) => updateConfig('includeBookings', !!checked)}
              />
              <Label htmlFor="bookings" className="font-normal">Bookings</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="satisfaction"
                checked={config.includeSatisfaction}
                onCheckedChange={(checked) => updateConfig('includeSatisfaction', !!checked)}
              />
              <Label htmlFor="satisfaction" className="font-normal">Satisfaction</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="aiPerformance"
                checked={config.includeAIPerformance}
                onCheckedChange={(checked) => updateConfig('includeAIPerformance', !!checked)}
              />
              <Label htmlFor="aiPerformance" className="font-normal">AI Performance</Label>
            </div>
          </div>
        </div>

        {/* Traffic Analytics */}
        <div className="space-y-3">
          <Label className="text-base">Traffic Analytics</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trafficSources"
                checked={config.includeTrafficSources}
                onCheckedChange={(checked) => updateConfig('includeTrafficSources', !!checked)}
              />
              <Label htmlFor="trafficSources" className="font-normal">Traffic Sources</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="topPages"
                checked={config.includeTopPages}
                onCheckedChange={(checked) => updateConfig('includeTopPages', !!checked)}
              />
              <Label htmlFor="topPages" className="font-normal">Top Pages</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visitorLocations"
                checked={config.includeVisitorLocations}
                onCheckedChange={(checked) => updateConfig('includeVisitorLocations', !!checked)}
              />
              <Label htmlFor="visitorLocations" className="font-normal">Visitor Locations</Label>
            </div>
          </div>
        </div>

        {/* Agent Data */}
        <div className="space-y-3">
          <Label className="text-base">Agent Data</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agents"
                checked={config.includeAgentPerformance}
                onCheckedChange={(checked) => updateConfig('includeAgentPerformance', !!checked)}
              />
              <Label htmlFor="agents" className="font-normal">Agent Performance</Label>
            </div>
          </div>
        </div>

        {/* Grouping */}
        <div className="space-y-3">
          <Label className="text-base">Data Grouping</Label>
          <Select value={config.grouping} onValueChange={(v) => updateConfig('grouping', v as ReportConfig['grouping'])}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <Label className="text-base">Include in Export</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="kpis"
                checked={config.includeKPIs}
                onCheckedChange={(checked) => updateConfig('includeKPIs', !!checked)}
              />
              <Label htmlFor="kpis" className="font-normal">KPI Summary</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="charts"
                checked={config.includeCharts}
                onCheckedChange={(checked) => updateConfig('includeCharts', !!checked)}
              />
              <Label htmlFor="charts" className="font-normal">Charts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tables"
                checked={config.includeTables}
                onCheckedChange={(checked) => updateConfig('includeTables', !!checked)}
              />
              <Label htmlFor="tables" className="font-normal">Data Tables</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
