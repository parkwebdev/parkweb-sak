/**
 * ExportButtons Component
 * 
 * Buttons for exporting analytics reports as CSV or PDF.
 * Generates and downloads report files with configured data.
 * @module components/analytics/ExportButtons
 */

import { Button } from '@/components/ui/button';
import { PdfIcon, CsvIcon } from './ExportIcons';
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { ReportConfig } from './ReportBuilder';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';

interface ExportButtonsProps {
  data: any;
  startDate: Date;
  endDate: Date;
  orgName: string;
  config: ReportConfig;
}

export const ExportButtons = ({ data, startDate, endDate, orgName, config }: ExportButtonsProps) => {

  const handleExportCSV = async () => {
    try {
      await generateCSVReport(data, config, startDate, endDate, orgName);
      toast.success('CSV exported successfully');
    } catch (error) {
      logger.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      await generatePDFReport(data, config, startDate, endDate, orgName);
      toast.success('PDF exported successfully');
    } catch (error) {
      logger.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleExportCSV}>
        <CsvIcon className="h-5 w-5 mr-2" />
        Generate CSV
      </Button>
      
      <Button variant="outline" onClick={handleExportPDF}>
        <PdfIcon className="h-5 w-5 mr-2" />
        Generate PDF
      </Button>
    </div>
  );
};
