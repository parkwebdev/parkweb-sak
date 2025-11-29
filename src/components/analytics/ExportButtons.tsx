import { Button } from '@/components/ui/button';
import { Download01 } from '@untitledui/icons';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { toast } from 'sonner';

interface ExportButtonsProps {
  data: any;
  startDate: Date;
  endDate: Date;
  orgName: string;
}

export const ExportButtons = ({ data, startDate, endDate, orgName }: ExportButtonsProps) => {
  const defaultConfig = {
    type: 'detailed' as const,
    includeConversations: true,
    includeLeads: true,
    includeAgentPerformance: true,
    includeUsageMetrics: true,
    grouping: 'day' as const,
    includeKPIs: true,
    includeCharts: false,
    includeTables: true,
  };

  const handleExportCSV = async () => {
    try {
      await generateCSVReport(data, defaultConfig, startDate, endDate, orgName);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      await generatePDFReport(data, defaultConfig, startDate, endDate, orgName);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        <Download01 className="h-4 w-4 mr-2" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF}>
        <Download01 className="h-4 w-4 mr-2" />
        PDF
      </Button>
    </div>
  );
};
