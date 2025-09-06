import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchInput } from '@/components/SearchInput';
import { Settings, Filter, ArrowUpDown, Eye, Send, Check, Download, Plus, Edit, Save, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, getBadgeVariant } from '@/lib/status-helpers';
import { useToast } from '@/hooks/use-toast';
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
    industry: '',
    projectType: '',
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
    if (advancedFilters.industry) {
      filtered = filtered.filter(item => 
        item.industry.toLowerCase().includes(advancedFilters.industry.toLowerCase())
      );
    }
    if (advancedFilters.projectType) {
      filtered = filtered.filter(item => 
        item.projectType.toLowerCase().includes(advancedFilters.projectType.toLowerCase())
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
      industry: '',
      projectType: '',
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

  return (
    <div className="flex h-screen bg-muted/30">
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar />
      </div>
      <div className="flex-1 ml-[280px] overflow-auto min-h-screen">
        <main className="flex-1 bg-muted/30 min-h-screen pt-8 pb-12">
          <header className="w-full font-medium">
            <div className="items-stretch flex w-full flex-col gap-4 px-8 py-0 max-md:px-4">
              <div className="w-full gap-4">
                <div className="content-start flex-wrap flex w-full gap-[16px_12px]">
                  <div className="min-w-64 text-xl text-foreground leading-none flex-1 shrink basis-[0%] gap-1">
                    <h1 className="text-foreground text-2xl font-semibold leading-tight mb-1">
                      Scope of Works
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Manage and review project scopes
                    </p>
                  </div>
                  <div className="items-center flex min-w-48 gap-2.5 text-xs leading-none">
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="w-full mt-6">
            <div className="w-full px-8 py-0 max-md:px-4">
              <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
                {/* Header with Filters, Search, and Settings */}
                <header className="w-full border-b border-border">
                  <div className="justify-between items-center flex w-full gap-3 flex-wrap px-4 py-3">
                    <div className="border shadow-sm self-stretch flex overflow-hidden text-xs text-foreground font-medium leading-none my-auto rounded-md border-border max-md:flex-wrap">
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
                    <div className="self-stretch flex items-center gap-2.5 whitespace-nowrap my-auto max-md:w-full max-md:flex-wrap">
                      <SearchInput
                        placeholder="Search"
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchResults={searchResults}
                        className="max-w-[240px] min-w-48 w-[240px] max-md:w-full max-md:min-w-0"
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
                            
                            <div>
                              <label className="text-sm font-medium mb-2 block">Industry</label>
                              <Input
                                placeholder="Filter by industry..."
                                value={advancedFilters.industry}
                                onChange={(e) => setAdvancedFilters(prev => ({...prev, industry: e.target.value}))}
                                className="text-xs"
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-2 block">Project Type</label>
                              <Input
                                placeholder="Filter by project type..."
                                value={advancedFilters.projectType}
                                onChange={(e) => setAdvancedFilters(prev => ({...prev, projectType: e.target.value}))}
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
                                <div className="flex flex-col gap-0.5">
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                                </div>
                                <span className="text-sm capitalize">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </div>
                            </div>
                          ))}
                          
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
                </header>

                <div className="w-full overflow-x-auto">
                  <Table className="table-auto">
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
                        <TableHead className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span>Project Title</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </TableHead>
                        {columnOrder.map(column => {
                          if (!showColumns[column as keyof typeof showColumns]) return null;
                          
                          switch(column) {
                            case 'client':
                              return (
                                <TableHead key="client" className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span>Client</span>
                                    <ArrowUpDown size={12} />
                                  </div>
                                </TableHead>
                              );
                            case 'projectType':
                              return (
                                <TableHead key="projectType" className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span>Project Type</span>
                                    <ArrowUpDown size={12} />
                                  </div>
                                </TableHead>
                              );
                            case 'industry':
                              return (
                                <TableHead key="industry" className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span>Industry</span>
                                    <ArrowUpDown size={12} />
                                  </div>
                                </TableHead>
                              );
                            case 'status':
                              return (
                                <TableHead key="status" className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span>Status</span>
                                    <ArrowUpDown size={12} />
                                  </div>
                                </TableHead>
                              );
                            case 'pages':
                              return (
                                <TableHead key="pages" className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span>Pages</span>
                                    <ArrowUpDown size={12} />
                                  </div>
                                </TableHead>
                              );
                            case 'integrations':
                              return (
                                <TableHead key="integrations" className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span>Integrations</span>
                                    <ArrowUpDown size={12} />
                                  </div>
                                </TableHead>
                              );
                            case 'dateModified':
                              return (
                                <TableHead key="dateModified" className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span>Date Modified</span>
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
                          <TableCell>
                            <div className="min-w-0">
                              <div className="font-medium whitespace-nowrap">{sow.title}</div>
                              <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                                <a 
                                  href={`mailto:${sow.email}`}
                                  className="hover:underline"
                                >
                                  {sow.clientContact}
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          {columnOrder.map(column => {
                            if (!showColumns[column as keyof typeof showColumns]) return null;
                            
                            switch(column) {
                              case 'client':
                                return (
                                  <TableCell key="client" className="text-muted-foreground whitespace-nowrap">
                                    {sow.client}
                                  </TableCell>
                                );
                              case 'projectType':
                                return (
                                  <TableCell key="projectType" className="text-muted-foreground whitespace-nowrap">
                                    {sow.projectType}
                                  </TableCell>
                                );
                              case 'industry':
                                return (
                                  <TableCell key="industry" className="text-muted-foreground whitespace-nowrap">
                                    {sow.industry}
                                  </TableCell>
                                );
                              case 'status':
                                return (
                                  <TableCell key="status">
                                    <Badge variant={getBadgeVariant(sow.status)}>
                                      {sow.status}
                                    </Badge>
                                  </TableCell>
                                );
                              case 'pages':
                                return (
                                  <TableCell key="pages" className="text-muted-foreground whitespace-nowrap">
                                    {sow.pages}
                                  </TableCell>
                                );
                              case 'integrations':
                                return (
                                  <TableCell key="integrations">
                                    <div className="flex items-center gap-1 whitespace-nowrap">
                                      {sow.integrations.length > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          {sow.integrations[0]}
                                        </Badge>
                                      )}
                                      {sow.integrations.length > 1 && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                                              +{sow.integrations.length - 1}
                                            </Badge>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="start" className="w-48 z-50">
                                            <DropdownMenuLabel>All Integrations</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {sow.integrations.map((integration, index) => (
                                              <DropdownMenuItem key={integration} className="text-xs">
                                                {integration}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </TableCell>
                                );
                              case 'dateModified':
                                return (
                                  <TableCell key="dateModified" className="text-muted-foreground whitespace-nowrap">
                                    {formatDate(sow.dateModified)}
                                  </TableCell>
                                );
                              default:
                                return null;
                            }
                          })}
                          {showColumns.actions && (
                            <TableCell>
                              <div className="flex gap-1">
                                <button 
                                  className="p-1 hover:bg-accent rounded"
                                  onClick={() => handleViewSow(sow)}
                                >
                                  <Eye size={14} />
                                </button>
                                <button 
                                  className="p-1 hover:bg-accent rounded"
                                  onClick={() => handleEditSow(sow)}
                                >
                                  <Send size={14} />
                                </button>
                                {sow.status === 'Approved' && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="p-1 hover:bg-accent rounded">
                                        <Download size={14} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Download Options</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
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
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
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