import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchInput } from '@/components/SearchInput';
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
  DotsHorizontal as MoreHorizontal 
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/hooks/use-sidebar';

const scopeOfWorks = [
  {
    id: '1',
    title: 'Mountain View RV Park Website',
    projectType: 'Web Design',
    client: 'Mountain View RV Park',
    clientContact: 'Sarah Johnson',
    email: 'sarah@mountainviewrv.com',
    industry: 'RV Park',
    status: 'Approved',
    dateCreated: '2024-01-15',
    dateModified: '2024-01-16',
    pages: 8,
    integrations: ['Booking System', 'Payment Gateway', 'Google Maps'],
    content: `# Mountain View RV Park - Web Design Project

## Project Overview
Create a modern, responsive website for Mountain View RV Park that showcases amenities and enables online bookings.

## Scope of Work

### Phase 1: Design & Planning
- Site architecture and wireframes
- Visual design mockups
- Content strategy

### Phase 2: Development
- Responsive website development
- Booking system integration
- Payment gateway setup
- Google Maps integration

### Phase 3: Testing & Launch
- Cross-browser testing
- Mobile optimization
- SEO implementation
- Go-live support

## Deliverables
- 8 fully designed and developed pages
- Booking system with calendar
- Payment processing capability
- Mobile-responsive design
- SEO optimization

## Timeline
- Phase 1: 2 weeks
- Phase 2: 4 weeks  
- Phase 3: 1 week

Total project duration: 7 weeks`
  },
  {
    id: '2',
    title: 'Elite Capital Partners Portal',
    projectType: 'Investment Portal',
    client: 'Elite Capital Partners',
    clientContact: 'Jessica Rodriguez',
    email: 'jessica@elitecapital.com',
    industry: 'Capital & Syndication',
    status: 'In Review',
    dateCreated: '2024-01-10',
    dateModified: '2024-01-12',
    pages: 12,
    integrations: ['Investor Portal', 'Document Management', 'CRM'],
    content: `# Elite Capital Partners - Investment Portal

## Project Overview
Develop a comprehensive investment portal for managing investor relations and deal flow.

## Scope of Work

### Phase 1: Portal Architecture
- User authentication system
- Investor dashboard design
- Document management structure

### Phase 2: Core Features
- Deal presentation system
- Investment tracking
- Communication tools
- Reporting capabilities

### Phase 3: Integration & Security
- CRM integration
- Security implementation
- Compliance features

## Deliverables
- 12-page investor portal
- Document management system
- CRM integration
- Security protocols

## Timeline
Total project duration: 10 weeks`
  },
  {
    id: '3',
    title: 'Local Plumbing Pro Website',
    projectType: 'Service Website',
    client: 'Local Plumbing Pro',
    clientContact: 'David Miller',
    email: 'david@localplumbingpro.com',
    industry: 'Local Business',
    status: 'Draft',
    dateCreated: '2024-01-08',
    dateModified: '2024-01-08',
    pages: 6,
    integrations: ['Appointment Booking', 'Contact Forms'],
    content: `# Local Plumbing Pro - Service Website

## Project Overview
Create a professional website for local plumbing services with online appointment booking.

## Scope of Work

### Phase 1: Website Development
- Service pages design
- Contact forms setup
- Appointment booking system

### Phase 2: Optimization
- Local SEO implementation
- Mobile optimization
- Performance optimization

## Deliverables
- 6-page service website
- Online appointment booking
- Contact form integration
- Local SEO setup

## Timeline
Total project duration: 4 weeks`
  }
];

const ScopeOfWorks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSow, setSelectedSow] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('view-all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  const [showColumns, setShowColumns] = useState({
    client: true,
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
  });
  const [columnOrder, setColumnOrder] = useState([
    'client',
    'projectType', 
    'industry',
    'status',
    'pages',
    'integrations',
    'dateModified'
  ]);
  
  const { toast } = useToast();
  const { createScopeWorkNotification } = useNotifications();

  // Extract unique industries and project types from data
  const availableIndustries = [...new Set(scopeOfWorks.map(item => item.industry))];
  const availableProjectTypes = [...new Set(scopeOfWorks.map(item => item.projectType))];

  const handleViewSow = (sow: any) => {
    setSelectedSow(sow);
    setEditedContent(sow.content);
    setEditedTitle(sow.title);
    setIsEditing(false);
  };

  const handleEditSow = (sow: any) => {
    setSelectedSow(sow);
    setEditedContent(sow.content);
    setEditedTitle(sow.title);
    setIsEditing(true);
  };

  const handleSaveChanges = () => {    
    toast({
      title: "Changes saved",
      description: "Your scope of work has been updated.",
    });
    setIsEditing(false);
  };

  const handleDownloadPDF = (sow: any) => {
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

  const handleDownloadDOC = (sow: any) => {
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
        new Date(item.dateCreated) >= new Date(advancedFilters.dateFrom)
      );
    }
    if (advancedFilters.dateTo) {
      filtered = filtered.filter(item => 
        new Date(item.dateCreated) <= new Date(advancedFilters.dateTo)
      );
    }
    if (advancedFilters.industry.length > 0) {
      filtered = filtered.filter(item => 
        advancedFilters.industry.includes(item.industry)
      );
    }
    if (advancedFilters.projectType.length > 0) {
      filtered = filtered.filter(item => 
        advancedFilters.projectType.includes(item.projectType)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredDataByTab().filter(row =>
    row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.projectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchResults = filteredData.map(sow => ({
    title: sow.client,
    subtitle: sow.projectType,
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
      + "Client,Project Type,Industry,Status,Pages,Date Modified\n"
      + filteredData.map(row => 
          `"${row.client}","${row.projectType}","${row.industry}","${row.status}","${row.pages}","${row.dateModified}"`
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
              <CardHeader className="compact-header border-b">
                <CardTitle className="text-base">Scope of Works</CardTitle>
                <CardDescription className="text-xs">
                  View and manage all project scope documents
                </CardDescription>
              </CardHeader>
              
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
                    <SearchInput
                      placeholder="Search"
                      value={searchTerm}
                      onChange={setSearchTerm}
                      searchResults={searchResults}
                      className="flex-1 lg:max-w-[240px] lg:min-w-48 lg:w-[240px]"
                    />
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
                        <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                        
                        <DropdownMenuCheckboxItem
                          checked={showColumns.client}
                          onCheckedChange={() => toggleColumn('client')}
                        >
                          Client
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
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <button
                            onClick={toggleAllSelection}
                            className="flex items-center justify-center w-5"
                          >
                            <div className={`border flex min-h-5 w-5 h-5 rounded-md border-solid border-border items-center justify-center ${
                              selectedRows.length === filteredData.length ? 'bg-primary border-primary' : 'bg-background'
                            }`}>
                              {selectedRows.length === filteredData.length && (
                                <Check size={12} className="text-primary-foreground" />
                              )}
                            </div>
                          </button>
                        </TableHead>
                        {showColumns.client && (
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <span>Client</span>
                              <ArrowUpDown size={12} />
                            </div>
                          </TableHead>
                        )}
                        {showColumns.projectType && (
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <span>Project Type</span>
                              <ArrowUpDown size={12} />
                            </div>
                          </TableHead>
                        )}
                        {showColumns.industry && (
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <span>Industry</span>
                              <ArrowUpDown size={12} />
                            </div>
                          </TableHead>
                        )}
                        {showColumns.status && (
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <span>Status</span>
                              <ArrowUpDown size={12} />
                            </div>
                          </TableHead>
                        )}
                        {showColumns.pages && (
                          <TableHead>Pages</TableHead>
                        )}
                        {showColumns.integrations && (
                          <TableHead>Integrations</TableHead>
                        )}
                        {showColumns.dateModified && (
                          <TableHead>
                            <div className="flex items-center gap-1">
                              <span>Modified</span>
                              <ArrowUpDown size={12} />
                            </div>
                          </TableHead>
                        )}
                        {showColumns.actions && (
                          <TableHead className="text-right">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((sow) => (
                        <TableRow key={sow.id}>
                          <TableCell>
                            <button
                              onClick={() => toggleRowSelection(sow.id)}
                              className="flex items-center justify-center w-5"
                            >
                              <div className={`border flex min-h-5 w-5 h-5 rounded-md border-solid border-border items-center justify-center ${
                                selectedRows.includes(sow.id) ? 'bg-primary border-primary' : 'bg-background'
                              }`}>
                                {selectedRows.includes(sow.id) && (
                                  <Check size={12} className="text-primary-foreground" />
                                )}
                              </div>
                            </button>
                          </TableCell>
                          {showColumns.client && (
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <ClientAvatar name={sow.client} size="sm" />
                                <div>
                                  <div className="font-medium text-sm">{sow.client}</div>
                                  <div className="text-xs text-muted-foreground">{sow.clientContact}</div>
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {showColumns.projectType && (
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {sow.projectType}
                              </Badge>
                            </TableCell>
                          )}
                          {showColumns.industry && (
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {sow.industry}
                              </Badge>
                            </TableCell>
                          )}
                          {showColumns.status && (
                            <TableCell>
                              <Badge variant={getBadgeVariant(sow.status)} className="text-xs">
                                {sow.status}
                              </Badge>
                            </TableCell>
                          )}
                          {showColumns.pages && (
                            <TableCell className="text-sm">{sow.pages}</TableCell>
                          )}
                          {showColumns.integrations && (
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {sow.integrations.slice(0, 2).map((integration) => (
                                  <Badge key={integration} variant="outline" className="text-xs">
                                    {integration}
                                  </Badge>
                                ))}
                                {sow.integrations.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{sow.integrations.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          )}
                          {showColumns.dateModified && (
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(sow.dateModified)}
                            </TableCell>
                          )}
                          {showColumns.actions && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
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
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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