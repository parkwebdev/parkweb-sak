import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload01, File06, AlertCircle, CheckCircle, Download01, ArrowLeft, ArrowRight } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: Array<{
    title: string;
    content: string;
    category: string;
    icon?: string;
  }>) => Promise<number>;
  existingCategories: string[];
}

type MappingField = 'title' | 'content' | 'category' | 'icon' | 'skip';

interface ColumnMapping {
  [columnIndex: number]: MappingField;
}

interface ParsedArticle {
  title: string;
  content: string;
  category: string;
  icon?: string;
  isValid: boolean;
  errors: string[];
}

// CSV Parser that handles quoted values and escaped quotes
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell)) rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else {
        currentCell += char;
      }
    }
  }
  
  if (currentCell || currentRow.length) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell)) rows.push(currentRow);
  }
  
  return rows;
};

// Smart auto-mapping based on header names
const autoMapColumn = (header: string): MappingField => {
  const h = header.toLowerCase().trim();
  if (['title', 'question', 'name', 'subject', 'headline'].some(k => h.includes(k))) return 'title';
  if (['content', 'answer', 'body', 'text', 'description', 'response'].some(k => h.includes(k))) return 'content';
  if (['category', 'group', 'section', 'type', 'topic'].some(k => h.includes(k))) return 'category';
  if (['icon', 'emoji'].some(k => h.includes(k))) return 'icon';
  return 'skip';
};

// Generate sample CSV template
const generateSampleCSV = (): string => {
  return `Title,Content,Category,Icon
"How do I reset my password?","To reset your password, go to Settings > Security > Reset Password. Click the reset button and follow the instructions sent to your email.","Account","🔐"
"What payment methods do you accept?","We accept Visa, Mastercard, American Express, and PayPal. All transactions are secured with SSL encryption.","Billing","💳"
"How do I contact support?","You can reach our support team via email at support@example.com or through the chat widget on our website.","Help","💬"`;
};

export const BulkImportDialog = ({ open, onOpenChange, onImport, existingCategories }: BulkImportDialogProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [parsedArticles, setParsedArticles] = useState<ParsedArticle[]>([]);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1);
    setCsvData(null);
    setHasHeaders(true);
    setColumnMapping({});
    setParsedArticles([]);
    setImporting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length < 2) {
        return;
      }

      setCsvData(parsed);
      
      // Auto-detect headers and create initial mapping
      const headers = parsed[0];
      const initialMapping: ColumnMapping = {};
      headers.forEach((header, index) => {
        initialMapping[index] = autoMapColumn(header);
      });
      setColumnMapping(initialMapping);
      setStep(2);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const downloadTemplate = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'help-articles-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const processArticles = useCallback(() => {
    if (!csvData) return;

    const dataRows = hasHeaders ? csvData.slice(1) : csvData;
    const headers = csvData[0];
    
    // Find mapped column indices
    const titleIndex = Object.entries(columnMapping).find(([, v]) => v === 'title')?.[0];
    const contentIndex = Object.entries(columnMapping).find(([, v]) => v === 'content')?.[0];
    const categoryIndex = Object.entries(columnMapping).find(([, v]) => v === 'category')?.[0];
    const iconIndex = Object.entries(columnMapping).find(([, v]) => v === 'icon')?.[0];

    const articles: ParsedArticle[] = dataRows.map((row) => {
      const title = titleIndex !== undefined ? row[parseInt(titleIndex)] || '' : '';
      const content = contentIndex !== undefined ? row[parseInt(contentIndex)] || '' : '';
      const category = categoryIndex !== undefined ? row[parseInt(categoryIndex)] || '' : '';
      const icon = iconIndex !== undefined ? row[parseInt(iconIndex)] || '' : '';

      const errors: string[] = [];
      if (!title.trim()) errors.push('Missing title');
      if (!content.trim()) errors.push('Missing content');
      if (!category.trim()) errors.push('Missing category');

      return {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        icon: icon.trim() || undefined,
        isValid: errors.length === 0,
        errors,
      };
    });

    setParsedArticles(articles);
    setStep(3);
  }, [csvData, hasHeaders, columnMapping]);

  const handleImport = async () => {
    const validArticles = parsedArticles.filter(a => a.isValid);
    if (validArticles.length === 0) return;

    setImporting(true);
    try {
      const count = await onImport(validArticles.map(({ title, content, category, icon }) => ({
        title,
        content,
        category,
        icon,
      })));
      handleClose();
    } catch (error) {
      logger.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedArticles.filter(a => a.isValid).length;
  const invalidCount = parsedArticles.filter(a => !a.isValid).length;
  const uniqueCategories = [...new Set(parsedArticles.filter(a => a.isValid).map(a => a.category))];
  const newCategories = uniqueCategories.filter(c => !existingCategories.includes(c));

  const mappingFields: { value: MappingField; label: string }[] = [
    { value: 'title', label: 'Title' },
    { value: 'content', label: 'Content' },
    { value: 'category', label: 'Category' },
    { value: 'icon', label: 'Icon (optional)' },
    { value: 'skip', label: 'Skip this column' },
  ];

  const hasTitleMapping = Object.values(columnMapping).includes('title');
  const hasContentMapping = Object.values(columnMapping).includes('content');
  const hasCategoryMapping = Object.values(columnMapping).includes('category');
  const canProceedToStep3 = hasTitleMapping && hasContentMapping && hasCategoryMapping;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Articles from CSV</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {s}
                </div>
                <span className={cn(
                  "text-xs",
                  step >= s ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s === 1 ? 'Upload' : s === 2 ? 'Map Columns' : 'Import'}
                </span>
                {s < 3 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <Upload01 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Drop your CSV file here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>

              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-xs text-primary hover:underline mx-auto"
              >
                <Download01 className="w-3.5 h-3.5" />
                Download sample template
              </button>
            </div>
          )}

          {/* Step 2: Map Columns */}
          {step === 2 && csvData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasHeaders"
                  checked={hasHeaders}
                  onCheckedChange={(checked) => setHasHeaders(checked === true)}
                />
                <Label htmlFor="hasHeaders" className="text-sm cursor-pointer">
                  First row contains headers
                </Label>
              </div>

              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Map your CSV columns to article fields:</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium text-xs">CSV Column</th>
                        <th className="text-left p-2 font-medium text-xs">Maps To</th>
                        <th className="text-left p-2 font-medium text-xs">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {csvData[0].map((header, index) => (
                        <tr key={index}>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <File06 className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">{hasHeaders ? header : `Column ${index + 1}`}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <Select
                              value={columnMapping[index] || 'skip'}
                              onValueChange={(value: MappingField) => {
                                setColumnMapping(prev => ({ ...prev, [index]: value }));
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {mappingFields.map((field) => (
                                  <SelectItem key={field.value} value={field.value} className="text-xs">
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <span className="text-xs text-muted-foreground truncate block max-w-[150px]">
                              {hasHeaders && csvData[1] ? csvData[1][index] : csvData[0][index]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!canProceedToStep3 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Required mappings missing:</p>
                    <ul className="mt-1 space-y-0.5">
                      {!hasTitleMapping && <li>• Title column not mapped</li>}
                      {!hasContentMapping && <li>• Content column not mapped</li>}
                      {!hasCategoryMapping && <li>• Category column not mapped</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview & Import */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{validCount} articles ready</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-muted-foreground">{invalidCount} will be skipped</span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground ml-auto">
                  {uniqueCategories.length} categories
                  {newCategories.length > 0 && (
                    <span className="text-primary"> ({newCategories.length} new)</span>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium text-xs w-8">Status</th>
                      <th className="text-left p-2 font-medium text-xs">Title</th>
                      <th className="text-left p-2 font-medium text-xs">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedArticles.slice(0, 8).map((article, index) => (
                      <tr key={index} className={cn(!article.isValid && "bg-destructive/5")}>
                        <td className="p-2">
                          {article.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {article.icon && <span>{article.icon}</span>}
                            <span className={cn(
                              "text-xs truncate max-w-[200px]",
                              !article.title && "text-muted-foreground italic"
                            )}>
                              {article.title || '(empty)'}
                            </span>
                          </div>
                          {!article.isValid && (
                            <p className="text-[10px] text-destructive mt-0.5">
                              {article.errors.join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="p-2">
                          <span className={cn(
                            "text-xs",
                            !article.category && "text-muted-foreground italic"
                          )}>
                            {article.category || '(empty)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {parsedArticles.length > 8 && (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-xs text-muted-foreground">
                          ... and {parsedArticles.length - 8} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {invalidCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Rows with missing required fields (title, content, or category) will be skipped during import.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
              disabled={importing}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          {step === 2 && (
            <Button onClick={processArticles} disabled={!canProceedToStep3}>
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleImport} disabled={validCount === 0 || importing} loading={importing}>
              Import {validCount} Articles
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
