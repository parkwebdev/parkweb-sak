import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload01 as Upload, X, CheckCircle, AlertCircle } from '@untitledui/icons';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface FieldMapping {
  csvField: string;
  clientField: string;
}

const CLIENT_FIELDS = [
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'title', label: 'Title', required: false },
  { key: 'company_name', label: 'Company', required: false },
  { key: 'industry', label: 'Industry', required: false },
  { key: 'address', label: 'Address', required: false },
];

const FIELD_ALIASES = {
  'first_name': ['first name', 'firstname', 'fname', 'first', 'given name'],
  'last_name': ['last name', 'lastname', 'lname', 'last', 'surname', 'family name'],
  'email': ['email', 'e-mail', 'email address', 'mail'],
  'phone': ['phone', 'telephone', 'tel', 'phone number', 'mobile', 'cell'],
  'title': ['title', 'job title', 'position', 'role'],
  'company_name': ['company', 'company name', 'organization', 'org', 'business'],
  'industry': ['industry', 'sector', 'business type'],
  'address': ['address', 'street address', 'full address', 'location', 'addr'],
};

export const CSVImportDialog: React.FC<CSVImportDialogProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split('\n');
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    });
  };

  const autoMapFields = (csvHeaders: string[]): FieldMapping[] => {
    return csvHeaders.map(csvField => {
      const normalizedCsvField = csvField.toLowerCase().trim();
      
      // Try to find a match in our aliases
      for (const [clientField, aliases] of Object.entries(FIELD_ALIASES)) {
        if (aliases.some(alias => 
          normalizedCsvField === alias || 
          normalizedCsvField.includes(alias) ||
          alias.includes(normalizedCsvField)
        )) {
          return { csvField, clientField };
        }
      }
      
      return { csvField, clientField: '' };
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must have at least a header row and one data row.",
          variant: "destructive",
        });
        return;
      }

      const csvHeaders = parsed[0];
      const dataRows = parsed.slice(1);
      
      setHeaders(csvHeaders);
      setCsvData(dataRows);
      setFieldMappings(autoMapFields(csvHeaders));
      setStep('mapping');
    };
    
    reader.readAsText(file);
  };

  const updateFieldMapping = (csvField: string, clientField: string) => {
    setFieldMappings(prev => 
      prev.map(mapping => 
        mapping.csvField === csvField 
          ? { ...mapping, clientField: clientField === 'skip' ? '' : clientField }
          : mapping
      )
    );
  };

  const validateMappings = (): boolean => {
    const requiredFields = CLIENT_FIELDS.filter(f => f.required).map(f => f.key);
    const mappedFields = fieldMappings
      .filter(m => m.clientField)
      .map(m => m.clientField);
    
    return requiredFields.every(field => mappedFields.includes(field));
  };

  const previewData = () => {
    if (!validateMappings()) {
      toast({
        title: "Missing Required Fields",
        description: "Please map all required fields (Email is required).",
        variant: "destructive",
      });
      return;
    }
    setStep('preview');
  };

  const importData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const mappingMap = fieldMappings.reduce((acc, mapping) => {
        if (mapping.clientField) {
          const csvIndex = headers.indexOf(mapping.csvField);
          acc[mapping.clientField] = csvIndex;
        }
        return acc;
      }, {} as Record<string, number>);

      const clientsToInsert = csvData.map(row => {
        const client: any = {
          user_id: user.id,
          status: 'active',
        };

        // Map CSV data to client fields
        Object.entries(mappingMap).forEach(([clientField, csvIndex]) => {
          const value = row[csvIndex]?.trim();
          if (value) {
            client[clientField] = value;
          }
        });

        // Generate client_name from first_name + last_name if available
        if (client.first_name || client.last_name) {
          client.client_name = `${client.first_name || ''} ${client.last_name || ''}`.trim();
        } else if (!client.client_name && client.email) {
          // Use email username as fallback name
          client.client_name = client.email.split('@')[0];
        }

        // Default company_name if not provided - use email domain or "Unknown Company"
        if (!client.company_name && client.email) {
          const emailDomain = client.email.split('@')[1]?.split('.')[0];
          client.company_name = emailDomain ? emailDomain.charAt(0).toUpperCase() + emailDomain.slice(1) : 'Unknown Company';
        } else if (!client.company_name) {
          client.company_name = 'Unknown Company';
        }

        // Default industry if not provided
        if (!client.industry) {
          client.industry = 'Other';
        }

        return client;
      }).filter(client => client.email); // Only import rows with email

      if (clientsToInsert.length === 0) {
        throw new Error('No valid clients to import (email is required)');
      }

      const { error } = await supabase
        .from('clients')
        .insert(clientsToInsert);

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `Successfully imported ${clientsToInsert.length} clients.`,
      });

      onImportComplete();
      handleClose();

    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setFieldMappings([]);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const getMappedPreviewData = () => {
    const mappingMap = fieldMappings.reduce((acc, mapping) => {
      if (mapping.clientField) {
        const csvIndex = headers.indexOf(mapping.csvField);
        acc[mapping.clientField] = csvIndex;
      }
      return acc;
    }, {} as Record<string, number>);

    return csvData.slice(0, 5).map(row => {
      const preview: any = {};
      Object.entries(mappingMap).forEach(([clientField, csvIndex]) => {
        preview[clientField] = row[csvIndex]?.trim() || '';
      });
      return preview;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Clients from CSV</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
              <p className="text-muted-foreground mb-4">
                Choose a CSV file with client data. The first row should contain column headers.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Expected columns:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>First Name, Last Name (or Full Name)</li>
                <li>Email (required)</li>
                <li>Phone, Title, Company, Industry</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-sm">File uploaded: {fileName}</span>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Map CSV Fields to Client Fields</h3>
              <div className="space-y-3">
                {fieldMappings.map((mapping) => (
                  <div key={mapping.csvField} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{mapping.csvField}</Label>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={mapping.clientField || 'skip'}
                        onValueChange={(value) => updateFieldMapping(mapping.csvField, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip this field</SelectItem>
                          {CLIENT_FIELDS.map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label} {field.required && '*'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <AlertCircle size={16} className="text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-400">
                * Email is required for each client
              </span>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview Import Data</h3>
            <p className="text-sm text-muted-foreground">
              Showing first 5 rows. {csvData.length} total clients will be imported.
            </p>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {CLIENT_FIELDS.filter(f => 
                          fieldMappings.some(m => m.clientField === f.key)
                        ).map(field => (
                          <th key={field.key} className="text-left p-2 font-medium">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getMappedPreviewData().map((row, index) => (
                        <tr key={index} className="border-b">
                          {CLIENT_FIELDS.filter(f => 
                            fieldMappings.some(m => m.clientField === f.key)
                          ).map(field => (
                            <td key={field.key} className="p-2">
                              {row[field.key] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={previewData}>
                Preview Data
              </Button>
            </>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back to Mapping
              </Button>
              <Button onClick={importData} disabled={loading}>
                {loading ? 'Importing...' : `Import ${csvData.length} Clients`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};