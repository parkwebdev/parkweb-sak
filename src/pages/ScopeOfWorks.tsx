import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const scopeOfWorks = [
  {
    id: '1',
    title: 'Mountain View RV Park - Web Design',
    client: 'Mountain View RV Park',
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
    industry: 'Local Business',
    status: 'Draft',
    dateCreated: '2024-01-08',
    dateModified: '2024-01-08',
    pages: 6,
    integrations: ['Appointment Booking', 'Contact Forms']
  }
];

const ScopeOfWorks = () => {
  return (
    <div className="flex h-screen bg-muted/30">
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar />
      </div>
      <div className="flex-1 ml-[296px] overflow-auto">
        <main className="flex-1 bg-muted/20 pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-8">
            <header className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-foreground text-3xl font-semibold leading-8 tracking-tight mb-2">
                    Scope of Works
                  </h1>
                  <p className="text-muted-foreground">
                    Manage and review all project scope documents
                  </p>
                </div>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New SoW
                </Button>
              </div>
            </header>

            {/* Search and Filter Bar */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search scope of works..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* SoW Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {scopeOfWorks.map((sow) => (
                <Card key={sow.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <FileText className="h-5 w-5 text-primary" />
                      <Badge variant={
                        sow.status === 'Approved' ? 'default' : 
                        sow.status === 'In Review' ? 'secondary' : 
                        'outline'
                      }>
                        {sow.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {sow.title}
                    </CardTitle>
                    <CardDescription>
                      {sow.client} • {sow.industry}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pages:</span>
                        <span className="font-medium">{sow.pages}</span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-muted-foreground mb-2 block">Integrations:</span>
                        <div className="flex flex-wrap gap-1">
                          {sow.integrations.slice(0, 2).map((integration) => (
                            <Badge key={integration} variant="outline" className="text-xs">
                              {integration}
                            </Badge>
                          ))}
                          {sow.integrations.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{sow.integrations.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Created: {new Date(sow.dateCreated).toLocaleDateString()}</span>
                          <span>Modified: {new Date(sow.dateModified).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State for New Users */}
            {scopeOfWorks.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Scope of Works Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first scope of work to get started with project management.
                </p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First SoW
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