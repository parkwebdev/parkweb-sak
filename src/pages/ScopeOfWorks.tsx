import React, { useState, useEffect } from 'react';
import { SimpleSearch } from '@/components/SimpleSearch';
import { 
  Settings01 as Settings, 
  FilterLines as Filter, 
  ArrowsDown as ArrowUpDown, 
  Eye, 
  Send01 as Send, 
  Check, 
  Download01 as Download, 
  File02 as FileText, 
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
    <TooltipProvider>
      <div className="bg-muted/30 min-h-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-8 space-y-6">
          {/* Desktop Header */}
          <header className="hidden lg:block">
            <div>
              <h1 className="text-2xl font-semibold leading-tight mb-1">
                Scope of Works
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage and track all project scope documents
              </p>
            </div>
          </header>

          {/* Main Content Card */}
          <Card className="w-full">
            {/* Header with Filters */}
            <div className="border-b border-border">
              <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
                {/* Filter Buttons - Mobile Optimized */}
                <div className="overflow-x-auto">
                  <div className="flex min-w-max rounded-md border border-border bg-background text-xs font-medium text-foreground shadow-sm overflow-hidden">
                    {['View all', 'Approved', 'In Review', 'Draft'].map((filter, index) => {
                      const filterKey = filter.toLowerCase().replace(' ', '-');
                      const isActive = activeFilter === filterKey;
                      return (
                        <button
                          key={filter}
                          onClick={() => setActiveFilter(filterKey)}
                          className={`flex min-h-8 items-center justify-center gap-1.5 px-3 py-1.5 transition-colors whitespace-nowrap ${
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/50'
                          } ${index < 3 ? 'border-r border-border' : ''}`}
                        >
                          <div className="text-xs leading-4">{filter}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Search and Controls */}
                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <SimpleSearch
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    className="flex-1 lg:max-w-[280px] lg:w-[280px]"
                  />
                  
                  {/* Control Buttons */}
                  <div className="flex gap-1 lg:gap-2">
                    {/* Advanced Filters */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 lg:px-4"
                        >
                          <Filter size={16} />
                          <span className="hidden lg:inline-block ml-2">Filters</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 p-4">
                        <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <div className="space-y-4 pt-2">
                          {/* Date Range */}
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
                          
                          {/* Industry Filter */}
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
                                    className="text-xs cursor-pointer"
                                  >
                                    {industry}
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

                    {/* Settings */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 lg:px-4"
                        >
                          <Settings size={16} />
                          <span className="hidden lg:inline-block ml-2">Settings</span>
                        </Button>
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
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View Toggle */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewModeToggle}
                      className="h-9 px-3"
                    >
                      {viewMode === 'table' ? <Grid size={16} /> : <List size={16} />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-sm text-muted-foreground">Loading scope of works...</div>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-12 w-12 flex items-center justify-center text-muted-foreground mb-4">
                    <FileText size={48} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No scope of works found</h3>
                  <p className="text-muted-foreground mb-4">
                    {scopeOfWorks.length === 0 
                      ? "Get started by creating your first scope of work document."
                      : "Try adjusting your search or filter criteria."
                    }
                  </p>
                </div>
              ) : (
                /* Mobile Card View */
                <div className="lg:hidden">
                  <div className="space-y-3 p-4">
                    {filteredData.map((sow) => (
                      <Card key={sow.id} className="border border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm line-clamp-2 mb-1">{sow.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ClientAvatar name={sow.client} size="sm" />
                                <span className="truncate">{sow.client}</span>
                              </div>
                            </div>
                            <Badge variant={getBadgeVariant(sow.status)} className="ml-2 text-xs">
                              {sow.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                            <div>
                              <span className="font-medium">Type:</span> {sow.project_type}
                            </div>
                            <div>
                              <span className="font-medium">Pages:</span> {sow.pages}
                            </div>
                            <div>
                              <span className="font-medium">Industry:</span> {sow.industry}
                            </div>
                            <div>
                              <span className="font-medium">Modified:</span> {formatDate(sow.date_modified)}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewSow(sow)}
                              className="flex-1 h-8 text-xs"
                            >
                              <Eye size={14} />
                              <span className="ml-1">View</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSow(sow)}
                              className="flex-1 h-8 text-xs"
                            >
                              <Edit size={14} />
                              <span className="ml-1">Edit</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Desktop Table View */}
              {!loading && filteredData.length > 0 && (
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedRows.length === filteredData.length}
                            onChange={toggleAllSelection}
                            className="rounded border-border"
                          />
                        </th>
                        {showColumns.companyName && (
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <button
                              onClick={() => handleSort('client')}
                              className="flex items-center gap-1 hover:text-foreground"
                            >
                              Client
                              {sortBy === 'client' && (
                                sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                              )}
                            </button>
                          </th>
                        )}
                        {showColumns.projectType && (
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <button
                              onClick={() => handleSort('project_type')}
                              className="flex items-center gap-1 hover:text-foreground"
                            >
                              Project Type
                              {sortBy === 'project_type' && (
                                sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                              )}
                            </button>
                          </th>
                        )}
                        {showColumns.industry && (
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Industry</th>
                        )}
                        {showColumns.status && (
                          <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        )}
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredData.map((sow) => (
                        <tr key={sow.id} className="hover:bg-muted/30">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(sow.id)}
                              onChange={() => toggleRowSelection(sow.id)}
                              className="rounded border-border"
                            />
                          </td>
                          {showColumns.companyName && (
                            <td className="p-3">
                              <div>
                                <div className="font-medium text-sm">{sow.title}</div>
                                <div className="text-xs text-muted-foreground">{sow.client}</div>
                              </div>
                            </td>
                          )}
                          {showColumns.projectType && (
                            <td className="p-3 text-sm">{sow.project_type}</td>
                          )}
                          {showColumns.industry && (
                            <td className="p-3 text-sm">{sow.industry}</td>
                          )}
                          {showColumns.status && (
                            <td className="p-3">
                              <Badge variant={getBadgeVariant(sow.status)} className="text-xs">
                                {sow.status}
                              </Badge>
                            </td>
                          )}
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewSow(sow)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditSow(sow)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit size={14} />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal size={14} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleDownloadPDF(sow)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadDOC(sow)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download DOC
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

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
      </div>
    </TooltipProvider>
  );
};

export default ScopeOfWorks;