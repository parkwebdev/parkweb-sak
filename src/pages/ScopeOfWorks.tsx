import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SearchInput } from '@/components/SearchInput';
import { FileText, Plus, Filter, Eye, Edit, Copy, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import { formatDate } from '@/lib/status-helpers';
import { useToast } from '@/hooks/use-toast';

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
    integrations: ['Booking System', 'Payment Gateway', 'Google Maps']
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
    integrations: ['Investor Portal', 'Document Management', 'CRM']
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
    integrations: ['Appointment Booking', 'Contact Forms']
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

  const filteredScopeOfWorks = scopeOfWorks.filter(sow =>
    sow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sow.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sow.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="flex items-center gap-4">
                <div className="border shadow-sm justify-center items-center flex gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg border-border">
                  <FileText size={14} />
                  <div className="text-xs font-medium">{filteredScopeOfWorks.length}</div>
                </div>
                <div>
                  <h1 className="text-foreground text-2xl font-semibold leading-tight mb-1">
                    Scope of Works
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Manage and review project scopes
                  </p>
                </div>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <SearchInput
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  searchResults={searchResults}
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            {/* Projects List */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-primary" />
                    <CardTitle className="text-base font-semibold">
                      Projects
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredScopeOfWorks.map((sow) => (
                    <div key={sow.id} className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-base truncate mb-1">{sow.title}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                <a 
                                  href={`mailto:${sow.email}`}
                                  className="hover:underline"
                                >
                                  {sow.clientContact}
                                </a>
                                <span className="mx-2">•</span>
                                <span>{sow.industry}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={getStatusBadgeVariant(sow.status)} className="text-xs px-2.5 py-1 w-auto">
                                {sow.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{sow.pages} pages</span>
                            <span>Updated {formatDate(sow.dateModified)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleCopyToClipboard(`/sow/${sow.id}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default ScopeOfWorks;