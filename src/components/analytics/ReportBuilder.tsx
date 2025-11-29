import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download01 } from '@untitledui/icons';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

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
  data: any;
  startDate: Date;
  endDate: Date;
}

export const ReportBuilder = ({ data, startDate, endDate }: ReportBuilderProps) => {
  const { currentOrg } = useOrganization();
  const [config, setConfig] = useState<ReportConfig>({
    type: 'detailed',
    includeConversations: true,
    includeLeads: true,
    includeAgentPerformance: true,
    includeUsageMetrics: true,
    grouping: 'day',
    includeKPIs: true,
    includeCharts: true,
    includeTables: true,
  });

  const updateConfig = <K extends keyof ReportConfig>(key: K, value: ReportConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleExportCSV = async () => {
    try {
      await generateCSVReport(data, config, startDate, endDate, currentOrg?.name || 'Organization');
      toast.success('CSV report generated successfully');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to generate CSV report');
    }
  };

  const handleExportPDF = async () => {
    try {
      await generatePDFReport(data, config, startDate, endDate, currentOrg?.name || 'Organization');
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Export Buttons */}
      <div className="flex justify-end gap-3">
        <Button onClick={handleExportCSV} variant="outline" size="lg">
          <Download01 className="mr-2 h-4 w-4" />
          Generate CSV
        </Button>
        <Button onClick={handleExportPDF} size="lg">
          <Download01 className="mr-2 h-4 w-4" />
          Generate PDF
        </Button>
      </div>
    </div>
  );
};
