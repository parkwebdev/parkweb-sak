import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PdfIcon, CsvIcon } from './ExportIcons';
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
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleExportCSV} className="h-10 w-10">
              <CsvIcon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export as CSV</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleExportPDF} className="h-10 w-10">
              <PdfIcon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export as PDF</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
