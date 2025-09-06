import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchInput } from '@/components/SearchInput';
import { FileText, Plus, Filter, Eye, Edit, Copy, Clock, User, X, Save, Download, FileDown, Settings, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/status-helpers';
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
    title: 'Mountain View RV Park - Web Design',
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
    title: 'Elite Capital Partners - Investment Portal',
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
    title: 'Local Plumbing Pro - Service Website',
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
  const [activeTab, setActiveTab] = useState('all');
  const [showColumns, setShowColumns] = useState({
    client: true,
    industry: true,
    status: true,
    pages: true,
    integrations: true,
    dateModified: true,
  });
  const { toast } = useToast();

  const searchResults = scopeOfWorks.map(sow => ({
    id: sow.id,
    title: sow.title,
    description: `${sow.client} • ${sow.industry} • ${sow.status}`,
    category: 'Scope of Works'
  }));

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
    let filtered = scopeOfWorks;
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(sow => {
        switch (activeTab) {
          case 'approved':
            return sow.status === 'Approved';
          case 'review':
            return sow.status === 'In Review';
          case 'draft':
            return sow.status === 'Draft';
          default:
            return true;
        }
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(sow =>
        sow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sow.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sow.industry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredScopeOfWorks = getFilteredDataByTab();
  
  const toggleColumn = (column: string) => {
    setShowColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar />
      </div>
      <div className="flex-1 ml-[280px] overflow-auto min-h-screen">
        <main className="flex-1 bg-muted/30 pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-8">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-foreground text-2xl font-semibold leading-tight mb-1">
                  Scope of Works
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage and review project scopes
                </p>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </Button>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                All ({scopeOfWorks.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'approved'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Approved ({scopeOfWorks.filter(s => s.status === 'Approved').length})
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'review'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                In Review ({scopeOfWorks.filter(s => s.status === 'In Review').length})
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'draft'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Draft ({scopeOfWorks.filter(s => s.status === 'Draft').length})
              </button>
            </div>

            {/* Search and Controls */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 max-w-md">
                <SearchInput
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  searchResults={searchResults}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                    <Settings size={16} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={showColumns.client}
                    onCheckedChange={() => toggleColumn('client')}
                  >
                    Client
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                    <Filter size={16} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Industry</Label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded border-gray-300" />
                          <span className="text-sm">RV Park</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded border-gray-300" />
                          <span className="text-sm">Capital & Syndication</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded border-gray-300" />
                          <span className="text-sm">Local Business</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Data Table */}
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Title</TableHead>
                    {showColumns.client && <TableHead>Client</TableHead>}
                    {showColumns.industry && <TableHead>Industry</TableHead>}
                    {showColumns.status && <TableHead>Status</TableHead>}
                    {showColumns.pages && <TableHead>Pages</TableHead>}
                    {showColumns.integrations && <TableHead>Integrations</TableHead>}
                    {showColumns.dateModified && <TableHead>Date Modified</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScopeOfWorks.map((sow) => (
                    <TableRow key={sow.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{sow.title}</div>
                          <div className="text-sm text-muted-foreground">{sow.clientContact}</div>
                        </div>
                      </TableCell>
                      {showColumns.client && (
                        <TableCell>{sow.client}</TableCell>
                      )}
                      {showColumns.industry && (
                        <TableCell>{sow.industry}</TableCell>
                      )}
                      {showColumns.status && (
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(sow.status)}>
                            {sow.status}
                          </Badge>
                        </TableCell>
                      )}
                      {showColumns.pages && (
                        <TableCell>{sow.pages}</TableCell>
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
                        <TableCell>{formatDate(sow.dateModified)}</TableCell>
                      )}
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleEditSow(sow)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Empty State */}
            {filteredScopeOfWorks.length === 0 && searchTerm && (
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
            )}

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
                        <Badge variant={getStatusBadgeVariant(selectedSow.status)} className="text-xs px-2 py-1">
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
        </main>
      </div>
    </div>
  );
};

export default ScopeOfWorks;