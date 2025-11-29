import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ReportConfig {
  type: 'summary' | 'detailed' | 'comparison';
  includeConversations: boolean;
  includeLeads: boolean;
  includeAgentPerformance: boolean;
  includeUsageMetrics: boolean;
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
    <div className="space-y-6 pb-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Customize your report settings and export preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type */}
          <div className="space-y-3">
            <Label className="text-base">Report Type</Label>
            <RadioGroup value={config.type} onValueChange={(v) => updateConfig('type', v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary" className="font-normal">Summary - High-level overview</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="font-normal">Detailed - Complete data analysis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comparison" id="comparison" />
                <Label htmlFor="comparison" className="font-normal">Comparison - Period over period</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data Categories */}
          <div className="space-y-3">
            <Label className="text-base">Include Data</Label>
            <div className="grid grid-cols-2 gap-3">
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
                  id="agents"
                  checked={config.includeAgentPerformance}
                  onCheckedChange={(checked) => updateConfig('includeAgentPerformance', !!checked)}
                />
                <Label htmlFor="agents" className="font-normal">Agent Performance</Label>
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

          {/* Grouping */}
          <div className="space-y-3">
            <Label className="text-base">Data Grouping</Label>
            <Select value={config.grouping} onValueChange={(v) => updateConfig('grouping', v as any)}>
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
    </div>
  );
};
