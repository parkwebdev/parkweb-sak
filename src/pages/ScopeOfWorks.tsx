import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SimpleSearch } from '@/components/SimpleSearch';
import { 
  Settings01 as Settings, 
  FilterLines as Filter, 
  ArrowsDown as ArrowUpDown, 
  Eye, 
  Send01 as Send, 
  Check, 
  Download01 as Download, 
  Plus, 
  Edit01 as Edit, 
  DotsHorizontal as MoreHorizontal,
  Grid01 as Grid,
  List,
  ArrowUp as SortAsc,
  ArrowDown as SortDesc
} from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { ClientAvatar } from '@/components/ClientAvatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, getBadgeVariant } from '@/lib/status-helpers';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { generateScopeOfWorkPDF, generateScopeOfWorkDOC } from '@/lib/document-generator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/hooks/use-sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ScopeOfWork {
  id: string;
  title: string;
  project_type: string;
  client: string;
  client_contact: string;
  email: string;
  industry: string;
  status: string;
  date_created: string;
  date_modified: string;
  pages: number;
  integrations: string[];
  content: string;
}

const ScopeOfWorks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSow, setSelectedSow] = useState<ScopeOfWork | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('view-all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'client' | 'project_type' | 'industry' | 'status' | 'pages' | 'date_modified'>('date_modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showColumns, setShowColumns] = useState({
    companyName: true,
    clientName: true,
    projectType: true,
    industry: true,
    status: true,
    pages: true,
    integrations: true,
    dateModified: true,
    actions: true,
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    industry: [] as string[],
    projectType: [] as string[],
    status: [] as string[],
    pages: { min: 0, max: 20 },
  });
  const [scopeOfWorks, setScopeOfWorks] = useState<ScopeOfWork[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { createScopeWorkNotification } = useNotifications();
  const { user } = useAuth();

  // Fetch scope of works from database
  useEffect(() => {
    if (user) {
      fetchScopeOfWorks();
    }
  }, [user]);

  const fetchScopeOfWorks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scope_of_works')
        .select('*')
        .order('date_modified', { ascending: false });

      if (error) {
        console.error('Error fetching scope of works:', error);
        toast({
          title: "Error",
          description: "Failed to fetch scope of works.",
          variant: "destructive",
        });
        return;
      }

      setScopeOfWorks(data || []);
    } catch (error) {
      console.error('Error fetching scope of works:', error);
      toast({
        title: "Error",
        description: "Failed to fetch scope of works.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values from data
  const availableIndustries = [...new Set(scopeOfWorks.map(item => item.industry))];
  const availableProjectTypes = [...new Set(scopeOfWorks.map(item => item.project_type))];
  const availableStatuses = [...new Set(scopeOfWorks.map(item => item.status))];

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleViewModeToggle = () => {
    setViewMode(viewMode === 'table' ? 'cards' : 'table');
  };

  const handleViewSow = (sow: ScopeOfWork) => {
    setSelectedSow(sow);
    setEditedContent(sow.content);
    setEditedTitle(sow.title);
    setIsEditing(false);
  };

  const handleEditSow = (sow: ScopeOfWork) => {
    setSelectedSow(sow);
    setEditedContent(sow.content);
    setEditedTitle(sow.title);
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedSow || !user) return;

    try {
      const { error } = await supabase
        .from('scope_of_works')
        .update({
          title: editedTitle,
          content: editedContent,
          date_modified: new Date().toISOString(),
        })
        .eq('id', selectedSow.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save changes.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Changes saved",
        description: "Your scope of work has been updated.",
      });
      setIsEditing(false);
      fetchScopeOfWorks(); // Refresh the data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = (sow: ScopeOfWork) => {
    try {
      const doc = generateScopeOfWorkPDF(sow);
      doc.save(`${sow.title.replace(/[^a-zA-Z0-9]/g, '_')}_ScopeOfWork.pdf`);
      toast({
        title: "PDF Generated",
        description: "Scope of work PDF has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDOC = (sow: ScopeOfWork) => {
    try {
      generateScopeOfWorkDOC(sow);
      toast({
        title: "DOC Generated",
        description: "Scope of work DOC has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate DOC. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedSow(null);
    setIsEditing(false);
    setEditedContent('');
    setEditedTitle('');
  };

  const getFilteredDataByTab = () => {
    let filtered = [...scopeOfWorks];
    
    // Apply active filter
    if (activeFilter !== 'view-all') {
      if (activeFilter === 'approved') {
        filtered = filtered.filter(item => item.status === 'Approved');
      } else if (activeFilter === 'in-review') {
        filtered = filtered.filter(item => item.status === 'In Review');
      } else if (activeFilter === 'draft') {
        filtered = filtered.filter(item => item.status === 'Draft');
      }
    }

    // Apply advanced filters
    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(item => 
        new Date(item.date_created) >= new Date(advancedFilters.dateFrom)
      );
    }
    if (advancedFilters.dateTo) {
      filtered = filtered.filter(item => 
        new Date(item.date_created) <= new Date(advancedFilters.dateTo)
      );
    }
    if (advancedFilters.industry.length > 0) {
      filtered = filtered.filter(item => 
        advancedFilters.industry.includes(item.industry)
      );
    }
    if (advancedFilters.projectType.length > 0) {
      filtered = filtered.filter(item => 
        advancedFilters.projectType.includes(item.project_type)
      );
    }
    if (advancedFilters.status.length > 0) {
      filtered = filtered.filter(item => 
        advancedFilters.status.includes(item.status)
      );
    }
    if (advancedFilters.pages.min > 0 || advancedFilters.pages.max < 20) {
      filtered = filtered.filter(item => 
        item.pages >= advancedFilters.pages.min && item.pages <= advancedFilters.pages.max
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'client':
          comparison = a.client.localeCompare(b.client);
          break;
        case 'project_type':
          comparison = a.project_type.localeCompare(b.project_type);
          break;
        case 'industry':
          comparison = a.industry.localeCompare(b.industry);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'pages':
          comparison = a.pages - b.pages;
          break;
        case 'date_modified':
        default:
          comparison = new Date(a.date_modified).getTime() - new Date(b.date_modified).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredData = getFilteredDataByTab().filter(row =>
    row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.project_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchResults = filteredData.map(sow => ({
    title: sow.client,
    subtitle: sow.client_contact,
    id: sow.id
  }));

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
      + "Company Name,Client Name,Project Type,Industry,Status,Pages,Date Modified\n"
      + filteredData.map(row => 
          `"${row.client}","${row.client_contact}","${row.project_type}","${row.industry}","${row.status}","${row.pages}","${row.date_modified}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scope_of_works.csv");
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
      industry: [],
      projectType: [],
      status: [],
      pages: { min: 0, max: 20 },
    });
  };

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <main className="flex-1 bg-muted/30 pt-4 lg:pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            {/* Header */}
            <header className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3 lg:hidden">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={20} />
                  </button>
                  <div>
                    <h1 className="text-xl font-semibold leading-tight">
                      Scope of Works
                    </h1>
                  </div>
                </div>
                
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-semibold leading-tight mb-1">
                    Scope of Works
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Manage and track all project scope documents
                  </p>
                </div>
              </div>
            </header>

            {/* Scope of Works Table */}
            <Card>
              {/* Table Header with Filters */}
              <div className="border-b border-border">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 px-4 py-3">
                  {/* Filter buttons */}
                  <div className="overflow-x-auto">
                    <div className="border shadow-sm flex overflow-hidden text-xs text-foreground font-medium leading-none rounded-md border-border min-w-max">
                      {['View all', 'Approved', 'In Review', 'Draft'].map((filter, index) => {
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
                  <div className="flex items-center gap-2.5 w-full lg:w-auto">
                    <SimpleSearch
                      placeholder="Search"
                      value={searchTerm}
                      onChange={setSearchTerm}
                      className="flex-1 lg:max-w-[240px] lg:min-w-48 lg:w-[240px]"
                    />
                    
                    {/* Filter Button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                          <Filter size={16} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 p-4">
                        <DropdownMenuLabel className="p-0 mb-2">Advanced Filters</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <div className="space-y-4 pt-2">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Date Range</label>
                            <div className="flex gap-2 px-1">
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
                            <label className="text-sm font-medium mb-2 block">Industry</label>
                            <div className="flex flex-wrap gap-1">
                              {availableIndustries.map((industry) => (
                                <button
                                  key={industry}
                                  onClick={() => {
                                    const newIndustry = advancedFilters.industry.includes(industry)
                                      ? advancedFilters.industry.filter(i => i !== industry)
                                      : [...advancedFilters.industry, industry];
                                    setAdvancedFilters(prev => ({...prev, industry: newIndustry}));
                                  }}
                                >
                                  <Badge
                                    variant={advancedFilters.industry.includes(industry) ? "default" : "outline"}
                                    className="text-xs cursor-pointer w-auto"
                                  >
                                    {industry}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Project Type</label>
                            <div className="flex flex-wrap gap-1">
                              {availableProjectTypes.map((type) => (
                                <button
                                  key={type}
                                  onClick={() => {
                                    const newType = advancedFilters.projectType.includes(type)
                                      ? advancedFilters.projectType.filter(t => t !== type)
                                      : [...advancedFilters.projectType, type];
                                    setAdvancedFilters(prev => ({...prev, projectType: newType}));
                                  }}
                                >
                                  <Badge
                                    variant={advancedFilters.projectType.includes(type) ? "default" : "outline"}
                                    className="text-xs cursor-pointer w-auto"
                                  >
                                    {type}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <div className="flex flex-wrap gap-1">
                              {availableStatuses.map((status) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    const newStatus = advancedFilters.status.includes(status)
                                      ? advancedFilters.status.filter(s => s !== status)
                                      : [...advancedFilters.status, status];
                                    setAdvancedFilters(prev => ({...prev, status: newStatus}));
                                  }}
                                >
                                  <Badge
                                    variant={advancedFilters.status.includes(status) ? "default" : "outline"}
                                    className="text-xs cursor-pointer w-auto"
                                  >
                                    {status}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={resetAdvancedFilters} className="text-xs">
                              Clear All
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort Button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                          {sortOrder === 'asc' ? <SortAsc size={16} className="text-muted-foreground" /> : <SortDesc size={16} className="text-muted-foreground" />}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => handleSort('client')}>
                          Company Name
                          {sortBy === 'client' && (
                            <div className="ml-auto">
                              {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                            </div>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('status')}>
                          Status
                          {sortBy === 'status' && (
                            <div className="ml-auto">
                              {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                            </div>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('project_type')}>
                          Project Type
                          {sortBy === 'project_type' && (
                            <div className="ml-auto">
                              {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                            </div>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('industry')}>
                          Industry
                          {sortBy === 'industry' && (
                            <div className="ml-auto">
                              {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                            </div>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('pages')}>
                          Pages
                          {sortBy === 'pages' && (
                            <div className="ml-auto">
                              {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                            </div>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort('date_modified')}>
                          Date Modified
                          {sortBy === 'date_modified' && (
                            <div className="ml-auto">
                              {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                            </div>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                     
                    {/* Settings Button */}
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
                        <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                        
                        <DropdownMenuCheckboxItem
                          checked={showColumns.companyName}
                          onCheckedChange={() => toggleColumn('companyName')}
                        >
                          Company Name
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={showColumns.clientName}
                          onCheckedChange={() => toggleColumn('clientName')}
                        >
                          Client Name
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={showColumns.projectType}
                          onCheckedChange={() => toggleColumn('projectType')}
                        >
                          Project Type
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={showColumns.industry}
                          onCheckedChange={() => toggleColumn('industry')}
                        >
                          Industry
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={showColumns.status}
                          onCheckedChange={() => toggleColumn('status')}
                        >
                          Status
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={showColumns.pages}
                          onCheckedChange={() => toggleColumn('pages')}
                        >
                          Pages
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={showColumns.integrations}
                          onCheckedChange={() => toggleColumn('integrations')}
                        >
                          Integrations
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={showColumns.dateModified}
                          onCheckedChange={() => toggleColumn('dateModified')}
                        >
                          Date Modified
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View Toggle Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewModeToggle}
                      className="h-8 px-2"
                    >
                      {viewMode === 'table' ? <Grid size={16} /> : <List size={16} />}
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-sm text-muted-foreground">Loading scope of works...</div>
                  </div>
                ) : scopeOfWorks.length === 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-sm text-muted-foreground">No scope of works found. Create your first one!</div>
                  </div>
                ) : (
                  <TooltipProvider>
                    {viewMode === 'table' ? (
                      <div className="divide-y divide-border">
                        {filteredData.map((sow) => (
                          <div key={sow.id} className="p-4 lg:p-6 hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col lg:flex-row lg:items-start gap-3 mb-3">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-base truncate mb-1">{sow.title}</h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
                                      <span className="truncate">{sow.client}</span>
                                      <span className="hidden sm:inline">•</span>
                                      <span className="truncate">{sow.client_contact}</span>
                                      <span className="hidden sm:inline">•</span>
                                      <a 
                                        href={`mailto:${sow.email}`}
                                        className="hover:underline truncate"
                                      >
                                        {sow.email}
                                      </a>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge variant={getBadgeVariant(sow.status)} className="text-xs w-auto">
                                      {sow.status}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs w-auto bg-muted">
                                      {sow.project_type}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs w-auto bg-muted">
                                      {sow.industry}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground mb-3">
                                  <span>Pages: {sow.pages}</span>
                                  <span>Modified: {formatDate(sow.date_modified)}</span>
                                  {sow.integrations.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span>Integrations:</span>
                                      <Badge variant="outline" className="text-xs w-auto bg-muted">
                                        {sow.integrations[0]}
                                      </Badge>
                                      {sow.integrations.length > 1 && (
                                        <Tooltip open={showTooltip === sow.id} onOpenChange={(open) => setShowTooltip(open ? sow.id : null)}>
                                          <TooltipTrigger asChild>
                                            <div 
                                              className="cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowTooltip(showTooltip === sow.id ? null : sow.id);
                                              }}
                                            >
                                              <Badge variant="outline" className="text-xs w-auto bg-muted hover:bg-muted/80">
                                                +{sow.integrations.length - 1}
                                              </Badge>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent className="z-50 bg-popover border border-border">
                                            <div className="space-y-1">
                                              <p className="font-medium">All Integrations:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {sow.integrations.map((integration: string, index: number) => (
                                                  <Badge key={index} variant="outline" className="text-xs w-auto bg-muted">
                                                    {integration}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => handleViewSow(sow)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditSow(sow)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadPDF(sow)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadDOC(sow)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download DOC
                                    </DropdownMenuItem>
                                    {sow.status !== 'Approved' && (
                                      <DropdownMenuItem>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send to Client
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredData.map((sow) => (
                          <Card 
                            key={sow.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleViewSow(sow)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-sm font-medium line-clamp-2">{sow.title}</CardTitle>
                                <Badge variant={getBadgeVariant(sow.status)} className="text-xs w-auto ml-2">
                                  {sow.status}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs">{sow.client}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{sow.pages} pages</span>
                                  <span>{formatDate(sow.date_modified)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TooltipProvider>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* View/Edit Dialog */}
      {selectedSow && (
        <Dialog open={!!selectedSow} onOpenChange={() => handleCloseModal()}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {isEditing ? (
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-lg font-semibold bg-transparent border-none p-0 focus:ring-0"
                  />
                ) : (
                  <span>{selectedSow.title}</span>
                )}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSaveChanges}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(selectedSow)}>
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadDOC(selectedSow)}>
                        <Download className="h-3 w-3 mr-1" />
                        DOC
                      </Button>
                    </>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Enter scope of work content..."
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedSow.content}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ScopeOfWorks;