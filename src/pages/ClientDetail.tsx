import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';
import { useClients, Client } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useRequests } from '@/hooks/useRequests';
import { ArrowLeft, Edit01 as Edit, Plus, Table, LayoutGrid01 as LayoutGrid, Eye } from '@untitledui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectViewMode, setProjectViewMode] = useState<"table" | "cards">("table");
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const { toast } = useToast();
  
  const { projects, loading: projectsLoading, refetch: refetchProjects } = useProjects(clientId);
  const { requests, loading: requestsLoading } = useRequests();
  
  // Filter requests for this client
  const clientRequests = requests.filter(r => r.client_email === client?.email);

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return;
      
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (error) throw error;
        
        // Map database fields to Client interface
        const clientData: Client = {
          id: data.id,
          name: data.client_name,
          company: data.company_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          industry: data.industry,
          status: data.status as Client['status'],
          personal_note: data.personal_note,
          created_at: data.created_at,
          updated_at: data.updated_at,
          onboarding_status: 'completed',
          total_requests: 0,
          active_requests: 0,
          completed_requests: 0,
          scope_of_works: 0,
          active_tasks: 0,
          last_activity: data.updated_at,
          avatar_url: undefined,
          folder_id: undefined
        };
        
        setClient(clientData);
      } catch (error) {
        console.error('Error fetching client:', error);
        toast({
          title: "Error",
          description: "Failed to fetch client details",
          variant: "destructive",
        });
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId, navigate, toast]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'onboarding': return 'secondary';
      case 'completed': return 'outline';
      case 'inactive': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-muted/30">
        <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        
        <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
          isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
        }`}>
          <div className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen bg-muted/30">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/clients')}>Back to Clients</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
          <div className="w-full px-4 lg:px-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/clients')}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Clients
              </Button>
            </div>

            {/* Client Info Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={client.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{client.name}</CardTitle>
                      <p className="text-lg text-muted-foreground">{client.company}</p>
                      {client.title && (
                        <p className="text-sm text-muted-foreground">{client.title}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                      <Badge variant={getStatusVariant(client.status)} className="mt-2">
                        {client.status}
                      </Badge>
                    </div>
                  </div>
                  <Button>
                    <Edit size={16} className="mr-2" />
                    Edit Client
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(client.first_name || client.last_name) && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Name</h4>
                      <p>{`${client.first_name || ''} ${client.last_name || ''}`.trim()}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Industry</h4>
                    <p>{client.industry}</p>
                  </div>
                  {client.title && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Title</h4>
                      <p>{client.title}</p>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Phone</h4>
                      <p>{client.phone}</p>
                    </div>
                  )}
                  {client.address && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Address</h4>
                      <p>{client.address}</p>
                    </div>
                  )}
                </div>
                {client.personal_note && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes</h4>
                      <p className="text-sm">{client.personal_note}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
                <TabsTrigger value="requests">Requests ({clientRequests.length})</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Projects
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{projects.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {clientRequests.filter(r => r.status !== 'completed').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {projects.reduce((sum, p) => sum + (p.task_count || 0), 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Projects</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={projectViewMode === "table" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setProjectViewMode("table")}
                        className="h-8 px-2"
                      >
                        <Table size={16} />
                      </Button>
                      <Button
                        variant={projectViewMode === "cards" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setProjectViewMode("cards")}
                        className="h-8 px-2"
                      >
                        <LayoutGrid size={16} />
                      </Button>
                    </div>
                    <Button 
                      onClick={() => setShowCreateProjectDialog(true)}
                      size="sm"
                      className="h-8 px-3 text-sm"
                    >
                      <Plus size={16} className="mr-2" />
                      New Project
                    </Button>
                  </div>
                </div>

                {projectViewMode === "table" ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                      <ProjectsTable projects={projects} loading={projectsLoading} clientId={clientId!} />
                    </CardContent>
                  </Card>
                ) : (
                  <ProjectsList projects={projects} loading={projectsLoading} clientId={clientId!} />
                )}
              </TabsContent>

              <TabsContent value="requests" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Requests</h3>
                  <Button size="sm" asChild>
                    <Link to="/requests">
                      <Eye size={16} className="mr-2" />
                      View All Requests
                    </Link>
                  </Button>
                </div>
                {/* Add requests table/list component here */}
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Requests functionality will be implemented here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Documents</h3>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Documents functionality will be implemented here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <CreateProjectDialog
          open={showCreateProjectDialog}
          onOpenChange={setShowCreateProjectDialog}
          clientId={clientId!}
          clientCompanyName={client?.company}
          onProjectCreated={refetchProjects}
        />
      </div>
    </div>
  );
};

export default ClientDetail;