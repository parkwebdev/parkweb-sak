import React, { useState, useEffect } from 'react';
import { 
  Settings01 as Settings, 
  ChevronDown, 
  ArrowsDown as ArrowUpDown, 
  Eye, 
  Send01 as Send, 
  Check, 
  User01 as User, 
  Clock, 
  DotsHorizontal as MoreHorizontal, 
  Download01 as Download, 
  Eye as EyeIcon, 
  DotsGrid as Columns, 
  Calendar, 
  Building07 as Building2, 
  FilterLines as Filter, 
  ChevronSelectorVertical as GripVertical 
} from '@untitledui/icons';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { getBadgeVariant } from '@/lib/status-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableRow {
  id: string;
  companyName: string;
  clientName: string;
  businessType: string;
  submittedDate: string;
  status: 'Complete' | 'Incomplete' | 'In Review';
  percentage: number;
}

interface DataTableProps {
  activeTab?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ activeTab = 'onboarding' }) => {
  const { user } = useAuth();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('view-all');
  const [currentActiveTab, setCurrentActiveTab] = useState(activeTab);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showColumns, setShowColumns] = useState({
    companyName: true,
    businessType: true,
    submitted: true,
    completion: true,
    status: true,
    actions: true,
  });
  const [columnOrder, setColumnOrder] = useState([
    'companyName',
    'businessType',
    'submitted', 
    'completion',
    'status'
  ]);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    businessType: '',
    completionRange: [0, 100],
  });

  useEffect(() => {
    setCurrentActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      fetchTableData();
    }
  }, [user, currentActiveTab]);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      let data: TableRow[] = [];
      
      if (currentActiveTab === 'onboarding') {
        // Fetch client onboarding links
        const { data: onboardingData, error } = await supabase
          .from('client_onboarding_links')
          .select('*')
          .order('date_sent', { ascending: false });

        if (error) {
          console.error('Error fetching onboarding data:', error);
          return;
        }

        data = onboardingData?.map(item => ({
          id: item.id,
          companyName: item.company_name,
          clientName: item.client_name,
          businessType: item.industry,
          submittedDate: new Date(item.date_sent).toISOString().split('T')[0],
          status: item.status === 'Completed' || item.status === 'Approved' ? 'Complete' as const : 
                 item.status === 'In Progress' || item.status === 'SOW Generated' ? 'In Review' as const : 
                 'Incomplete' as const,
          percentage: item.status === 'Completed' || item.status === 'Approved' ? 100 : 
                     item.status === 'SOW Generated' ? 85 :
                     item.status === 'In Progress' ? 60 : 25
        })) || [];
      } else if (currentActiveTab === 'scope-of-work') {
        // Fetch scope of works
        const { data: sowData, error } = await supabase
          .from('scope_of_works')
          .select('*')
          .order('date_created', { ascending: false });

        if (error) {
          console.error('Error fetching scope of work data:', error);
          return;
        }

        data = sowData?.map(item => ({
          id: item.id,
          companyName: item.client,
          clientName: item.client_contact,
          businessType: item.industry,
          submittedDate: new Date(item.date_created).toISOString().split('T')[0],
          status: item.status === 'Approved' ? 'Complete' as const : 
                 item.status === 'Client Review' || item.status === 'Agency Review' ? 'In Review' as const : 
                 'Incomplete' as const,
          percentage: item.status === 'Approved' ? 100 : 
                     item.status === 'Client Review' || item.status === 'Agency Review' ? 75 : 
                     25
        })) || [];
      } else if (currentActiveTab === 'completed') {
        // Fetch completed items from both tables
        const [onboardingResult, sowResult] = await Promise.all([
          supabase.from('client_onboarding_links').select('*').eq('status', 'Approved'),
          supabase.from('scope_of_works').select('*').eq('status', 'Approved')
        ]);

        const completedOnboarding = onboardingResult.data?.map(item => ({
          id: item.id,
          companyName: item.company_name,
          clientName: item.client_name,
          businessType: item.industry,
          submittedDate: new Date(item.date_sent).toISOString().split('T')[0],
          status: 'Complete' as const,
          percentage: 100
        })) || [];

        const completedSOW = sowResult.data?.map(item => ({
          id: item.id,
          companyName: item.client,
          clientName: item.client_contact,
          businessType: item.industry,
          submittedDate: new Date(item.date_created).toISOString().split('T')[0],
          status: 'Complete' as const,
          percentage: 100
        })) || [];

        data = [...completedOnboarding, ...completedSOW].sort((a, b) => 
          new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
        );
      }
      
      setTableData(data);
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDataByTab = () => {
    let filtered = [...tableData];

    // Apply active filter
    if (activeFilter !== 'view-all') {
      if (activeFilter === 'complete') {
        filtered = filtered.filter(item => item.status === 'Complete');
      } else if (activeFilter === 'incomplete') {
        filtered = filtered.filter(item => item.status === 'Incomplete');
      } else if (activeFilter === 'in-review') {
        filtered = filtered.filter(item => item.status === 'In Review');
      }
    }

    // Apply advanced filters
    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(item => 
        new Date(item.submittedDate) >= new Date(advancedFilters.dateFrom)
      );
    }
    if (advancedFilters.dateTo) {
      filtered = filtered.filter(item => 
        new Date(item.submittedDate) <= new Date(advancedFilters.dateTo)
      );
    }
    if (advancedFilters.businessType) {
      filtered = filtered.filter(item => 
        item.businessType.toLowerCase().includes(advancedFilters.businessType.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredData = getFilteredDataByTab();

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    setSelectedRows(
      selectedRows.length === filteredData.length 
        ? [] 
        : filteredData.map(row => row.id)
    );
  };

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Company Name,Client Name,Business Type,Submitted Date,Status,Completion\n"
      + filteredData.map(row => 
          `"${row.companyName}","${row.clientName}","${row.businessType}","${row.submittedDate}","${row.status}","${row.percentage}%"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "client_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleColumn = (column: keyof typeof showColumns) => {
    setShowColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      businessType: '',
      completionRange: [0, 100],
    });
  };

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder];
    const [movedColumn] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedColumn);
    setColumnOrder(newOrder);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      moveColumn(dragIndex, dropIndex);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
      {/* New Header with Filters, Search, and Settings */}
      <header className="w-full border-b border-border">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 px-4 py-3">
          {/* Filter buttons - scrollable on mobile */}
          <div className="overflow-x-auto">
            <div className="border shadow-sm flex overflow-hidden text-xs text-foreground font-medium leading-none rounded-md border-border min-w-max">
              {['View all', 'Complete', 'Incomplete', 'In Review'].map((filter, index) => {
                const filterKey = filter.toLowerCase().replace(' ', '-');
                const isActive = activeFilter === filterKey;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filterKey)}
                    className={`justify-center items-center flex min-h-8 gap-1.5 px-2.5 py-1.5 transition-colors whitespace-nowrap ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/50'
                    } ${index < 3 ? 'border-r-border border-r border-solid' : ''}`}
                  >
                    <div className="text-xs leading-4 self-stretch my-auto">
                      {filter}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Search and controls */}
          <div className="flex items-center gap-2.5 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                  <Filter size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-4">
                <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder="From"
                        value={advancedFilters.dateFrom}
                        onChange={(e) => setAdvancedFilters(prev => ({...prev, dateFrom: e.target.value}))}
                        className="text-xs"
                      />
                      <Input
                        type="date"
                        placeholder="To"
                        value={advancedFilters.dateTo}
                        onChange={(e) => setAdvancedFilters(prev => ({...prev, dateTo: e.target.value}))}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Business Type</label>
                    <Input
                      placeholder="Filter by business type..."
                      value={advancedFilters.businessType}
                      onChange={(e) => setAdvancedFilters(prev => ({...prev, businessType: e.target.value}))}
                      className="text-xs"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={resetAdvancedFilters} className="text-xs">
                      Clear All
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                  <Settings size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Table Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Column Order</DropdownMenuLabel>
                
                {columnOrder.map((column, index) => (
                  <div 
                    key={column} 
                    className="flex items-center justify-between px-2 py-2 hover:bg-accent/50 cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-muted-foreground" />
                      <span className="text-sm capitalize">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  </div>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                
                <DropdownMenuCheckboxItem
                  checked={showColumns.companyName}
                  onCheckedChange={() => toggleColumn('companyName')}
                >
                  Company Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showColumns.businessType}
                  onCheckedChange={() => toggleColumn('businessType')}
                >
                  Business Type
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showColumns.submitted}
                  onCheckedChange={() => toggleColumn('submitted')}
                >
                  Submitted
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showColumns.completion}
                  onCheckedChange={() => toggleColumn('completion')}
                >
                  Completion
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showColumns.status}
                  onCheckedChange={() => toggleColumn('status')}
                >
                  Status
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="w-full overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              {columnOrder.map(column => {
                if (!showColumns[column as keyof typeof showColumns]) return null;
                
                switch(column) {
                  case 'companyName':
                    return (
                      <TableHead key="companyName">
                        <div className="flex items-center gap-1">
                          <span>Company Name</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </TableHead>
                    );
                  case 'businessType':
                    return (
                      <TableHead key="businessType">
                        <div className="flex items-center gap-1">
                          <span>Business Type</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </TableHead>
                    );
                  case 'submitted':
                    return (
                      <TableHead key="submitted">
                        <div className="flex items-center gap-1">
                          <span>Submitted</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </TableHead>
                    );
                  case 'completion':
                    return (
                      <TableHead key="completion">
                        <div className="flex items-center gap-1">
                          <span>Completion</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </TableHead>
                    );
                  case 'status':
                    return (
                      <TableHead key="status">
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </TableHead>
                    );
                  default:
                    return null;
                }
              })}
              {showColumns.actions && (
                <TableHead className="w-24">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.id}>
                {columnOrder.map(column => {
                  if (!showColumns[column as keyof typeof showColumns]) return null;
                  
                  switch(column) {
                    case 'companyName':
                      return (
                        <TableCell key="companyName">
                          <div>
                            <div className="font-medium">{row.companyName}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <a 
                                href={`mailto:${row.clientName.toLowerCase().replace(' ', '')}@example.com`}
                                className="hover:underline"
                              >
                                {row.clientName}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                      );
                    case 'businessType':
                      return (
                        <TableCell key="businessType" className="text-muted-foreground">
                          {row.businessType}
                        </TableCell>
                      );
                    case 'submitted':
                      return (
                        <TableCell key="submitted" className="text-muted-foreground">
                          {new Date(row.submittedDate).toLocaleDateString()}
                        </TableCell>
                      );
                    case 'completion':
                      return (
                        <TableCell key="completion">
                          <ProgressBar percentage={row.percentage} />
                        </TableCell>
                      );
                    case 'status':
                      return (
                        <TableCell key="status">
                          <Badge variant={getBadgeVariant(row.status)}>
                            {row.status}
                          </Badge>
                        </TableCell>
                      );
                    default:
                      return null;
                  }
                })}
                {showColumns.actions && (
                  <TableCell>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-accent rounded">
                        <Eye size={14} />
                      </button>
                      {row.status !== 'Complete' && (
                        <button className="p-1 hover:bg-accent rounded">
                          <Send size={14} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <footer className="bg-muted/30 w-full">
        <div className="justify-between items-center flex w-full gap-5 px-4 py-3 max-md:flex-wrap max-md:px-3">
          <div className="text-muted-foreground text-sm leading-5">
            Page 1 of 10
          </div>
          <div className="items-center flex gap-1">
            <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden bg-background px-3 py-2 rounded-lg border-border hover:bg-accent/50">
              <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
                <div className="text-foreground text-sm leading-5 self-stretch my-auto">
                  Previous
                </div>
              </div>
            </button>
            <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden bg-background px-3 py-2 rounded-lg border-border hover:bg-accent/50">
              <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
                <div className="text-foreground text-sm leading-5 self-stretch my-auto">
                  Next
                </div>
              </div>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};