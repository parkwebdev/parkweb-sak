import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchInput } from '@/components/SearchInput';
import { DraggableCard } from '@/components/DraggableCard';
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
  Save01 as Save, 
  X, 
  File02 as FileText, 
  DotsGrid as GripVertical 
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
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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

const COLUMN_ORDER = ['Draft', 'In Review', 'Approved'];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Approved':
      return 'complete';
    case 'In Review':
      return 'in-review';
    case 'Draft':
      return 'incomplete';
    default:
      return 'default';
  }
};

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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'client'>('date');
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [data, setData] = useState(scopeOfWorks);
  
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Extract unique industries and project types from data
  const availableIndustries = [...new Set(data.map(item => item.industry))];
  const availableProjectTypes = [...new Set(data.map(item => item.projectType))];

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Link has been copied to your clipboard.",
    });
  };

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
    // Update the data
    setData(prev => prev.map(item => 
      item.id === selectedSow.id 
        ? { ...item, title: editedTitle, content: editedContent }
        : item
    ));
    
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCard(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the containers
    const activeItem = data.find(item => item.id === activeId);
    const overItem = data.find(item => item.id === overId);
    
    if (!activeItem) return;
    
    // If we're dragging over a column name, update the status
    if (COLUMN_ORDER.includes(overId)) {
      if (activeItem.status !== overId) {
        setData(prev => prev.map(item => 
          item.id === activeId 
            ? { ...item, status: overId }
            : item
        ));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeItem = data.find(item => item.id === activeId);
    
    if (!activeItem) return;
    
    // If we're dropping on a column, update the status
    if (COLUMN_ORDER.includes(overId)) {
      if (activeItem.status !== overId) {
        setData(prev => prev.map(item => 
          item.id === activeId 
            ? { ...item, status: overId, dateModified: new Date().toISOString().split('T')[0] }
            : item
        ));
        
        toast({
          title: "Status Updated",
          description: `"${activeItem.title}" moved to ${overId}`,
        });
      }
    }
  };

  const getFilteredDataByTab = () => {
    let filtered = [...data];
    
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

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'client':
          comparison = a.client.localeCompare(b.client);
          break;
        case 'date':
        default:
          comparison = new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredData = getFilteredDataByTab().filter(row =>
    row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.projectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchResults = filteredData.map(sow => ({
    title: sow.title,
    subtitle: sow.client,
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
        : filteredData.map(sow => sow.id)
    );
  };

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Title,Client,Project Type,Industry,Status,Pages,Date Created\n"
      + filteredData.map(sow => 
          `"${sow.title}","${sow.client}","${sow.projectType}","${sow.industry}","${sow.status}","${sow.pages}","${sow.dateCreated}"`
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

  const toggleIndustryFilter = (industry: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      industry: prev.industry.includes(industry)
        ? prev.industry.filter(i => i !== industry)
        : [...prev.industry, industry]
    }));
  };

  const toggleProjectTypeFilter = (projectType: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      projectType: prev.projectType.includes(projectType)
        ? prev.projectType.filter(pt => pt !== projectType)
        : [...prev.projectType, projectType]
    }));
  };

  const removeIndustryFilter = (industry: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      industry: prev.industry.filter(i => i !== industry)
    }));
  };

  const removeProjectTypeFilter = (projectType: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      projectType: prev.projectType.filter(pt => pt !== projectType)
    }));
  };

  const handleSort = (field: 'date' | 'title' | 'client') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
          <header className="w-full font-medium">
            <div className="items-stretch flex w-full flex-col gap-4 px-4 lg:px-8 py-0">
              <div className="w-full gap-4">
                <div className="content-start flex-wrap flex w-full gap-4 lg:gap-[16px_12px]">
                  <div className="flex items-center gap-3 lg:hidden w-full mb-2">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="p-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                    >
                      <Plus size={20} />
                    </button>
                    <h1 className="text-foreground text-xl font-semibold leading-tight">
                      Scope of Works
                    </h1>
                  </div>
                
                  <div className="min-w-0 lg:min-w-64 text-xl text-foreground leading-none flex-1 shrink basis-[0%] gap-1">
                    <h1 className="hidden lg:block text-foreground text-2xl font-semibold leading-tight mb-1">
                      Scope of Works
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Manage and review project scopes
                    </p>
                  </div>
                  <div className="items-center flex min-w-0 lg:min-w-48 gap-2.5 text-xs leading-none">
                    <Button className="flex items-center gap-2 w-full lg:w-auto h-8 text-xs">
                      <Plus className="h-3 w-3" />
                      Create New
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="w-full mt-6">
            <div className="w-full px-4 lg:px-8 py-0">
              <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
                {/* Header with Filters, Search, and Settings */}
                <header className="w-full border-b border-border">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 px-4 py-3">
                    {/* Filter buttons - scrollable on mobile */}
                    <div className="overflow-x-auto">
                      <div className="border shadow-sm flex overflow-hidden text-xs text-foreground font-medium leading-none rounded-md border-border min-w-max">
                        {['View all', 'Approved', 'In Review', 'Draft'].map((filter, index) => {
                          const filterKey = filter.toLowerCase().replace(' ', '-');
                          const isActive = activeFilter === filterKey;
                        return (
                          <button
                            key={filter}
                            onClick={() => setActiveFilter(filterKey)}
                            className={`justify-center items-center flex min-h-8 gap-1.5 px-2.5 py-1.5 max-md:px-2 max-md:text-xs transition-colors ${
                              isActive ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/50'
                            } ${index < 3 ? 'border-r-border border-r border-solid' : ''}`}
                          >
                            <div className="text-xs leading-4 self-stretch my-auto max-md:text-xs">
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
                         <DropdownMenuContent align="end" className="w-96 p-4 z-50 max-h-[80vh] overflow-y-auto">
                           <div className="text-sm font-medium mb-2">Advanced Filters</div>
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
                                  className="text-xs h-8"
                                />
                                <Input
                                  type="date"
                                  placeholder="To"
                                  value={advancedFilters.dateTo}
                                  onChange={(e) => setAdvancedFilters(prev => ({...prev, dateTo: e.target.value}))}
                                  className="text-xs h-8"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-2 block">Industry</label>
                              <div className="space-y-2">
                                {/* Active industry filters */}
                                {advancedFilters.industry.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {advancedFilters.industry.map((industry) => (
                                      <span 
                                        key={industry}
                                        className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                                      >
                                        {industry}
                                        <button
                                          onClick={() => removeIndustryFilter(industry)}
                                          className="hover:bg-primary/20 rounded-full p-0.5"
                                        >
                                          <X size={10} />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* Available industry options */}
                                <div className="flex flex-wrap gap-1">
                                  {availableIndustries
                                    .filter(industry => !advancedFilters.industry.includes(industry))
                                    .map((industry) => (
                                    <button
                                      key={industry}
                                      onClick={() => toggleIndustryFilter(industry)}
                                      className="inline-flex items-center bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-2 py-1 rounded-md text-xs transition-colors"
                                    >
                                      {industry}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-2 block">Project Type</label>
                              <div className="space-y-2">
                                {/* Active project type filters */}
                                {advancedFilters.projectType.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {advancedFilters.projectType.map((projectType) => (
                                      <span 
                                        key={projectType}
                                        className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                                      >
                                        {projectType}
                                        <button
                                          onClick={() => removeProjectTypeFilter(projectType)}
                                          className="hover:bg-primary/20 rounded-full p-0.5"
                                        >
                                          <X size={10} />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* Available project type options */}
                                <div className="flex flex-wrap gap-1">
                                  {availableProjectTypes
                                    .filter(projectType => !advancedFilters.projectType.includes(projectType))
                                    .map((projectType) => (
                                    <button
                                      key={projectType}
                                      onClick={() => toggleProjectTypeFilter(projectType)}
                                      className="inline-flex items-center bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-2 py-1 rounded-md text-xs transition-colors"
                                    >
                                      {projectType}
                                    </button>
                                  ))}
                                </div>
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
                      
                      {/* Column Sorting */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                            <ArrowUpDown size={16} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSort('date')}>
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Date {sortBy === 'date' && `(${sortOrder})`}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort('title')}>
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Title {sortBy === 'title' && `(${sortOrder})`}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort('client')}>
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Client {sortBy === 'client' && `(${sortOrder})`}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                            <Settings size={16} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Board Settings</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={handleExportData}>
                            <Download className="mr-2 h-4 w-4" />
                            Export to CSV
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Show Information</DropdownMenuLabel>
                          
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
                </header>

                {/* Kanban Board */}
                <div className="p-4">
                  {/* Board Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
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
                      <span className="text-sm text-muted-foreground">
                        {selectedRows.length > 0 ? `${selectedRows.length} selected` : `${filteredData.length} projects`}
                      </span>
                    </div>
                  </div>

                  {/* Kanban Columns */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 min-h-[600px]">
                      {/* Draft Column */}
                      <div className="bg-card/50 rounded-lg border border-border flex flex-col">
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              Draft
                            </h3>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {filteredData.filter(sow => sow.status === 'Draft').length}
                            </Badge>
                          </div>
                        </div>
                        <SortableContext
                          items={filteredData.filter(sow => sow.status === 'Draft').map(sow => sow.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                            {filteredData.filter(sow => sow.status === 'Draft').map((sow) => (
                              <DraggableCard
                                key={sow.id}
                                sow={sow}
                                isSelected={selectedRows.includes(sow.id)}
                                onToggleSelection={toggleRowSelection}
                                onView={handleViewSow}
                                onEdit={handleEditSow}
                                showColumns={showColumns}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>

                      {/* In Review Column */}
                      <div className="bg-card/50 rounded-lg border border-border flex flex-col">
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              In Review
                            </h3>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {filteredData.filter(sow => sow.status === 'In Review').length}
                            </Badge>
                          </div>
                        </div>
                        <SortableContext
                          items={filteredData.filter(sow => sow.status === 'In Review').map(sow => sow.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                            {filteredData.filter(sow => sow.status === 'In Review').map((sow) => (
                              <DraggableCard
                                key={sow.id}
                                sow={sow}
                                isSelected={selectedRows.includes(sow.id)}
                                onToggleSelection={toggleRowSelection}
                                onView={handleViewSow}
                                onEdit={handleEditSow}
                                showColumns={showColumns}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>

                      {/* Approved Column */}
                      <div className="bg-card/50 rounded-lg border border-border flex flex-col">
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Approved
                            </h3>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {filteredData.filter(sow => sow.status === 'Approved').length}
                            </Badge>
                          </div>
                        </div>
                        <SortableContext
                          items={filteredData.filter(sow => sow.status === 'Approved').map(sow => sow.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                            {filteredData.filter(sow => sow.status === 'Approved').map((sow) => (
                              <DraggableCard
                                key={sow.id}
                                sow={sow}
                                isSelected={selectedRows.includes(sow.id)}
                                onToggleSelection={toggleRowSelection}
                                onView={handleViewSow}
                                onEdit={handleEditSow}
                                onDownloadPDF={handleDownloadPDF}
                                onDownloadDOC={handleDownloadDOC}
                                showColumns={showColumns}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    </div>

                    <DragOverlay>
                      {activeCard ? (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg opacity-90">
                          <div className="font-medium text-sm line-clamp-2">
                            {data.find(item => item.id === activeCard)?.title}
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              </div>
            </div>
          </section>

          {/* Empty State */}
          {filteredData.length === 0 && searchTerm && (
            <section className="w-full px-8 py-0 max-md:px-4">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No projects found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try different search terms or create a new project.
                </p>
                <Button className="flex items-center gap-2 h-8 text-xs">
                  <Plus className="h-3 w-3" />
                  Create New
                </Button>
              </div>
            </section>
          )}
        </main>

        {/* Scope of Work Viewer/Editor Modal */}
        <Dialog open={!!selectedSow} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-lg font-semibold">
                    {isEditing ? 'Edit Scope of Work' : 'Scope of Work'}
                  </DialogTitle>
                  {selectedSow && (
                    <Badge variant={getBadgeVariant(selectedSow.status)} className="text-xs px-2 py-1">
                      {selectedSow.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveChanges}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {selectedSow && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {selectedSow.clientContact} • {selectedSow.industry} • {selectedSow.pages} pages
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              {isEditing ? (
                <div className="flex flex-col h-full gap-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Project Title</Label>
                    <Input
                      id="title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <Label htmlFor="content" className="text-sm font-medium mb-2">Scope of Work Content</Label>
                    <Textarea
                      id="content"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="flex-1 min-h-[400px] font-mono text-sm resize-none"
                      placeholder="Enter your scope of work content here..."
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto pr-2">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {selectedSow?.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ScopeOfWorks;