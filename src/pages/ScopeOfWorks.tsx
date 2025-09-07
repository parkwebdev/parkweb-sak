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
  CheckCircle,
  Download01 as Download, 
  Plus, 
  Edit01 as Edit, 
  DotsHorizontal as MoreHorizontal,
  Grid01 as Grid,
  List,
  ArrowUp as SortAsc,
  ArrowDown as SortDesc,
  Trash01 as Trash
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
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { generateScopeOfWorkPDF, generateScopeOfWorkDOC } from '@/lib/document-generator';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
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
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

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
  const [scopeOfWorks, setScopeOfWorks] = useState<ScopeOfWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  const { toast } = useToast();
  const { createScopeWorkNotification } = useNotifications();
  const { sendStageEmail } = useEmailTemplates();
  const { user } = useAuth();

  // Initialize keyboard shortcuts
  const { shortcuts } = useKeyboardShortcuts([
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcutsModal(true)
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'Delete selected items',
      action: () => selectedRows.length > 0 && setShowDeleteDialog(true)
    }
  ]);

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
        toast({
          title: "Error",
          description: "Failed to fetch scope of works.",
          variant: "destructive",
        });
        return;
      }

      setScopeOfWorks(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch scope of works.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedRows.length === 0) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase
        .from('scope_of_works')
        .delete()
        .in('id', selectedRows)
        .select();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete selected items. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        toast({
          title: "Error",
          description: "Failed to delete items. Check permissions.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Items deleted",
        description: `Successfully deleted ${selectedRows.length} scope of work(s).`,
      });
      
      setSelectedRows([]);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      fetchScopeOfWorks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    setSelectedRows(
      selectedRows.length === scopeOfWorks.length 
        ? [] 
        : scopeOfWorks.map(row => row.id)
    );
  };

  const handleApproveSow = async (sow: ScopeOfWork) => {
    try {
      // Update the SOW status to Approved
      const { data: updateData, error: updateError } = await supabase
        .from('scope_of_works')
        .update({
          status: 'Approved',
          date_modified: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sow.id)
        .select();

      if (updateError) {
        toast({
          title: "Error",
          description: "Failed to approve SOW. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!updateData || updateData.length === 0) {
        toast({
          title: "Error", 
          description: "Failed to update SOW status. Check permissions.",
          variant: "destructive",
        });
        return;
      }

      // Update the corresponding onboarding link to show 100% completion
      const { error: onboardingUpdateError } = await supabase
        .from('client_onboarding_links')
        .update({
          status: 'Approved',
          sow_status: 'Approved',
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', sow.email)
        .eq('client_name', sow.client);

      if (onboardingUpdateError) {
        // Don't fail the whole process if onboarding link update fails
      }
      
      // Send SOW approval email to the CLIENT's email address
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-stage-email', {
          body: {
            templateName: 'sow_approval',
            clientEmail: sow.email,
            variables: {
              client_name: sow.client,
              company_name: sow.client,
              sow_title: sow.title
            }
          }
        });

        if (emailError) {
          toast({
            title: "Warning",
            description: `SOW approved but failed to send email to ${sow.email}`,
            variant: "destructive",
          });
        }
      } catch (emailError) {
        toast({
          title: "Warning", 
          description: `SOW approved but failed to send email to ${sow.email}`,
          variant: "destructive",
        });
      }

      // Refresh the data to show updated status and hide approve button
      await fetchScopeOfWorks();
      
      toast({
        title: "SOW Approved",
        description: `SOW approved for ${sow.client}. Onboarding progress updated to 100%. Approval email sent to ${sow.email}`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve SOW. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-muted/30">
        <div className={`flex-1 overflow-auto transition-all duration-300 ${
          isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
        }`}>
          <main className="flex-1 bg-muted/30 pt-4 lg:pt-8 pb-12">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              {/* Skeleton Header */}
              <div className="mb-6">
                <div className="h-8 bg-muted rounded animate-pulse w-64 mb-2"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-96"></div>
              </div>
              
              {/* Skeleton Table */}
              <div className="bg-card rounded-lg border">
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-8 bg-muted rounded animate-pulse w-80"></div>
                    <div className="h-8 bg-muted rounded animate-pulse w-20 ml-auto"></div>
                  </div>
                </div>
                <div className="p-0">
                  <div className="overflow-x-auto">
                    <div className="w-full">
                      <div className="border-b p-3 flex items-center gap-3">
                        <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-28"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                      </div>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border-b p-3 flex items-center gap-3">
                          <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                          <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                          <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                          <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                          <div className="flex gap-2">
                            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          onShowShortcuts={() => setShowShortcutsModal(true)}
        />
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
                
                <div className="hidden lg:flex lg:items-center lg:justify-between lg:w-full">
                  <div>
                    <h1 className="text-2xl font-semibold leading-tight mb-1">
                      Scope of Works
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Manage and track all project scope documents
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* Scope of Works Table */}
            <Card>
              {/* Table Header with Filters */}
              <div className="border-b border-border">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 px-4 py-3">
                   <div className="flex items-center gap-2">
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
                               className={`px-3 py-2 ${
                                 isActive
                                   ? 'bg-primary text-primary-foreground'
                                   : 'bg-card hover:bg-accent'
                               } ${
                                 index === 0 ? 'rounded-l-md' : ''
                               } ${
                                 index === 3 ? 'rounded-r-md' : ''
                               } ${
                                 index !== 3 ? 'border-r border-border' : ''
                               } transition-colors`}
                             >
                               {filter}
                             </button>
                           );
                         })}
                       </div>
                     </div>
                   </div>
                   
                   <div className="ml-auto">
                     {selectedRows.length > 0 && (
                       <button
                         onClick={() => setShowDeleteDialog(true)}
                         className="px-3 py-2 bg-card hover:bg-accent border shadow-sm text-xs text-foreground font-medium leading-none rounded-md border-border transition-colors flex items-center gap-1.5"
                       >
                         <Trash className="h-3 w-3" />
                       </button>
                     )}
                   </div>
                </div>
              </div>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                         <th className="text-left p-3">
                           <button
                             onClick={toggleAllSelection}
                             className="flex items-center justify-center w-5"
                           >
                             <div className={`border flex min-h-5 w-5 h-5 rounded-md border-solid border-border items-center justify-center ${
                               selectedRows.length === scopeOfWorks.length && scopeOfWorks.length > 0 ? 'bg-primary border-primary' : 'bg-background'
                             }`}>
                               {selectedRows.length === scopeOfWorks.length && scopeOfWorks.length > 0 && (
                                 <Check size={12} className="text-primary-foreground" />
                               )}
                             </div>
                           </button>
                         </th>
                        <th className="text-left p-3">Client</th>
                        <th className="text-left p-3">Project Type</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Date Modified</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scopeOfWorks.map((sow) => (
                        <tr key={sow.id} className="border-b hover:bg-muted/50">
                           <td className="p-3">
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
                           </td>
                          <td className="p-3">{sow.client}</td>
                          <td className="p-3">{sow.project_type}</td>
                          <td className="p-3">
                            <Badge variant={getBadgeVariant(sow.status)}>
                              {sow.status}
                            </Badge>
                          </td>
                          <td className="p-3">{formatDate(sow.date_modified)}</td>
                           <td className="p-3">
                             <div className="flex items-center gap-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                   setSelectedSow(sow);
                                   setEditedContent(sow.content);
                                   setEditedTitle(sow.title);
                                   setIsEditing(false);
                                 }}
                               >
                                 <Eye className="h-3 w-3" />
                               </Button>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                   setSelectedSow(sow);
                                   setEditedContent(sow.content);
                                   setEditedTitle(sow.title);
                                   setIsEditing(true);
                                 }}
                               >
                                 <Edit className="h-3 w-3" />
                               </Button>
                               {sow.status !== 'Approved' && (
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleApproveSow(sow)}
                                   className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                 >
                                   <CheckCircle className="h-3 w-3" />
                                 </Button>
                               )}
                             </div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={!!selectedSow} onOpenChange={() => setSelectedSow(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {isEditing ? 'Edit Scope of Work' : 'View Scope of Work'}
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {isEditing && (
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
                      onClick={async () => {
                        // Handle save logic here
                        if (selectedSow) {
                          const { error } = await supabase
                            .from('scope_of_works')
                            .update({
                              title: editedTitle,
                              content: editedContent,
                              date_modified: new Date().toISOString()
                            })
                            .eq('id', selectedSow.id);
                          
                          if (error) {
                            toast({
                              title: "Error",
                              description: "Failed to save changes.",
                              variant: "destructive",
                            });
                          } else {
                            toast({
                              title: "Saved",
                              description: "Scope of work updated successfully.",
                            });
                            setIsEditing(false);
                            fetchScopeOfWorks();
                          }
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedSow && `${selectedSow.client} - ${selectedSow.project_type}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              </>
            ) : (
              selectedSow && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-semibold mb-4">{selectedSow.title}</h2>
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                    {selectedSow.content}
                  </div>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Scope of Works"
        description={`Are you sure you want to delete ${selectedRows.length} scope of work(s)? This action cannot be undone.`}
        confirmationText="delete"
        confirmationValue={deleteConfirmation}
        onConfirmationValueChange={setDeleteConfirmation}
        onConfirm={handleDeleteSelected}
        isDeleting={isDeleting}
      />
      
      <KeyboardShortcutsModal
        open={showShortcutsModal}
        onOpenChange={setShowShortcutsModal}
        shortcuts={shortcuts}
      />
    </div>
  );
};

export default ScopeOfWorks;