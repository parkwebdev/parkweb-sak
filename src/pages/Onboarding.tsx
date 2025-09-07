import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Plus, Link01 as Link2, Copy01 as Copy, Send01 as Send, Eye as Eye, Trash01 as Trash, Check, SearchSm, FilterLines, Settings01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { INDUSTRY_OPTIONS } from '@/lib/constants';
import { getStatusColor, formatDate } from '@/lib/status-helpers';
import { createOnboardingUrl, createEmailTemplate, openEmailClient, copyToClipboard } from '@/lib/form-helpers';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { ProgressBar } from '@/components/ProgressBar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { BulkActionDropdown } from '@/components/BulkActionDropdown';
import { useSidebar } from '@/hooks/use-sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { UserAccountCard } from '@/components/UserAccountCard';

interface ClientLink {
  id: string;
  client_name: string;
  company_name: string;
  email: string;
  industry: string;
  status: string;
  date_sent: string;
  last_activity: string;
  onboarding_url: string;
  sow_status?: string | null;
  personal_note?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const Onboarding = () => {
  const { isCollapsed } = useSidebar();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientLinks, setClientLinks] = useState<ClientLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [newClient, setNewClient] = useState({
    client_name: '',
    company_name: '',
    email: '',
    industry: ''
  });
  const [activeFilter, setActiveFilter] = useState('View all');
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendWelcomeEmail } = useEmailTemplates();
  const { triggerOnboardingCompletion } = useRealtimeNotifications();
  
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  // Initialize keyboard shortcuts
  const { shortcuts } = useKeyboardShortcuts([
    {
      key: '.',
      ctrlKey: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcutsModal(true)
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open command palette',
      action: () => {} // Let SearchInput handle this
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'Delete selected items',
      action: () => selectedForDelete.length > 0 && setShowDeleteDialog(true)
    }
  ]);

  // Fetch client links from database
  useEffect(() => {
    if (user) {
      fetchClientLinks();
    }
  }, [user]);

  const fetchClientLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_onboarding_links')
        .select('*')
        .order('date_sent', { ascending: false });

      if (error) {
        console.error('Error fetching client links:', error);
        return;
      }

      setClientLinks(data || []);
    } catch (error) {
      console.error('Error fetching client links:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate progress percentage based on status
  const getProgressPercentage = (status: ClientLink['status']) => {
    switch (status) {
      case 'Sent': return 20;
      case 'In Progress': return 40;
      case 'Completed': return 60;
      case 'SOW Generated': return 80;
      case 'Approved': return 100;
      default: return 0;
    }
  };

  const handleCreateLink = async () => {
    if (!user) return;

    try {
      const onboardingUrl = createOnboardingUrl(newClient.client_name, newClient.company_name);
      
      const { error } = await supabase
        .from('client_onboarding_links')
        .insert({
          client_name: newClient.client_name,
          company_name: newClient.company_name,
          email: newClient.email,
          industry: newClient.industry,
          onboarding_url: onboardingUrl,
          user_id: user.id
        });

      if (error) {
        console.error('Error creating client link:', error);
        toast({
          title: "Error",
          description: "Failed to create onboarding link. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Send welcome email automatically
      const emailResult = await sendWelcomeEmail(
        newClient.client_name,
        newClient.company_name,
        newClient.email,
        `${window.location.origin}${onboardingUrl}`
      );

      // Reset form
      setNewClient({
        client_name: '',
        company_name: '',
        email: '',
        industry: ''
      });
      setShowCreateDialog(false);
      
      // Refresh the list
      fetchClientLinks();
      
      if (!emailResult.success) {
        console.error("Failed to send welcome email:", emailResult.error);
        toast({
          title: "Link Created",
          description: "Onboarding link created but welcome email failed to send. You can resend it manually.",
        });
      } else {
        toast({
          title: "Success!",
          description: `Onboarding link created and welcome email sent to ${newClient.email}`,
        });
      }
    } catch (error) {
      console.error('Error creating client link:', error);
      toast({
        title: "Error",
        description: "Failed to create onboarding link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyToClipboard = async (url: string) => {
    // Ensure URL is properly formatted - handle both relative and absolute URLs
    let fullUrl = url;
    if (!fullUrl.startsWith('http')) {
      fullUrl = `${window.location.origin}${url}`;
    } else {
      // If it's an absolute URL, replace the domain with current one
      const urlObj = new URL(fullUrl);
      const currentOrigin = window.location.origin;
      fullUrl = `${currentOrigin}${urlObj.pathname}${urlObj.search}`;
    }
    
    const success = await copyToClipboard(fullUrl);
    
    if (success) {
      toast({
        title: "Link copied!",
        description: "The onboarding link has been copied to your clipboard.",
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Please try copying the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (clientLink: ClientLink) => {
    setSendingEmail(clientLink.id);
    
    try {
      // Ensure URL is properly formatted - handle both relative and absolute URLs
      let fullUrl = clientLink.onboarding_url;
      if (!fullUrl.startsWith('http')) {
        fullUrl = `${window.location.origin}${fullUrl}`;
      } else {
        // If it's an absolute URL, replace the domain with current one
        const urlObj = new URL(fullUrl);
        const currentOrigin = window.location.origin;
        fullUrl = `${currentOrigin}${urlObj.pathname}${urlObj.search}`;
      }
      
      const emailResult = await sendWelcomeEmail(
        clientLink.client_name,
        clientLink.company_name,
        clientLink.email,
        fullUrl
      );
      
      if (!emailResult.success) {
        console.error("Failed to send welcome email:", emailResult.error);
        toast({
          title: "Email Error",
          description: "Failed to send email. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Sent",
          description: `Welcome email sent to ${clientLink.email}`,
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleViewOnboarding = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    window.open(fullUrl, '_blank');
  };

  const handleApproveSOW = async (link: ClientLink) => {
    try {
      // Update the status to Approved
      const { error: updateError } = await supabase
        .from('client_onboarding_links')
        .update({
          status: 'Approved',
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', link.id);

      if (updateError) {
        console.error('Error updating link status:', updateError);
        toast({
          title: "Error",
          description: "Failed to approve SOW. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Send completion email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-stage-email', {
          body: {
            templateName: 'completion',
            to: link.email,
            variables: {
              client_name: link.client_name,
              company_name: link.company_name
            }
          }
        });

        if (emailError) {
          console.error('Error sending completion email:', emailError);
        }
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
      }

      // Refresh the client links
      await fetchClientLinks();
      
      toast({
        title: "SOW Approved",
        description: `SOW approved for ${link.client_name}. Completion email sent.`,
      });
    } catch (error) {
      console.error('Error approving SOW:', error);
      toast({
        title: "Error",
        description: "Failed to approve SOW. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedForDelete.length === 0) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('client_onboarding_links')
        .delete()
        .in('id', selectedForDelete);

      if (error) {
        console.error('Error deleting client links:', error);
        toast({
          title: "Error",
          description: "Failed to delete selected items. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Items deleted",
        description: `Successfully deleted ${selectedForDelete.length} item(s).`,
      });
      
      setSelectedForDelete([]);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      fetchClientLinks();
    } catch (error) {
      console.error('Error deleting client links:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedForDelete(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    const filteredLinks = getFilteredClientLinks();
    setSelectedForDelete(
      selectedForDelete.length === filteredLinks.length 
        ? [] 
        : filteredLinks.map(link => link.id)
    );
  };

  // Filter function for client links
  const getFilteredClientLinks = () => {
    let filtered = clientLinks;
    
    // Apply status filter
    if (activeFilter !== 'View all') {
      filtered = filtered.filter(link => link.status === activeFilter);
    }
    
    return filtered;
  };

  // Bulk export function
  const handleBulkExport = () => {
    const selectedLinks = clientLinks.filter(link => 
      selectedForDelete.includes(link.id)
    );
    
    if (selectedLinks.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to export",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ['Client Name', 'Company', 'Email', 'Industry', 'Status', 'Date Sent'];
    const csvContent = [
      headers.join(','),
      ...selectedLinks.map(link => [
        link.client_name,
        link.company_name,
        link.email,
        link.industry,
        link.status,
        formatDate(link.date_sent)
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onboarding-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${selectedLinks.length} items to CSV`,
    });
  };

  // Bulk status update function
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedForDelete.length === 0) return;

    try {
      const { error } = await supabase
        .from('client_onboarding_links')
        .update({ status: newStatus })
        .in('id', selectedForDelete);

      if (error) {
        console.error('Error updating statuses:', error);
        toast({
          title: "Error",
          description: "Failed to update statuses. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Refresh data
      fetchClientLinks();
      setSelectedForDelete([]);

      toast({
        title: "Success",
        description: `Updated ${selectedForDelete.length} items to "${newStatus}"`,
      });
    } catch (error) {
      console.error('Error in bulk status update:', error);
      toast({
        title: "Error",
        description: "Failed to update statuses. Please try again.",
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
              
              {/* Skeleton Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="h-20 bg-muted rounded animate-pulse"></div>
                <div className="h-20 bg-muted rounded animate-pulse"></div>
                <div className="h-20 bg-muted rounded animate-pulse"></div>
                <div className="h-20 bg-muted rounded animate-pulse"></div>
              </div>
              
              {/* Skeleton Client Links Card */}
              <div className="bg-card rounded-lg border">
                <div className="p-6 border-b">
                  <div className="h-6 bg-muted rounded animate-pulse w-48 mb-2"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-80"></div>
                </div>
                <div className="p-0">
                  <div className="divide-y divide-border">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-6">
                        <div className="flex items-start gap-3">
                          <div className="w-4 h-4 bg-muted rounded animate-pulse flex-shrink-0 mt-1"></div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="h-5 bg-muted rounded animate-pulse w-48"></div>
                                <div className="h-4 bg-muted rounded animate-pulse w-36"></div>
                                <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                              </div>
                              <div className="flex gap-2">
                                <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                                <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                                <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded animate-pulse w-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
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
            {/* Compact Header */}
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
                      Client Onboarding
                    </h1>
                  </div>
                </div>
                
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-semibold leading-tight mb-1">
                    Client Onboarding
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Generate personalized onboarding links and manage client intake workflow
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <BulkActionDropdown
                    selectedCount={selectedForDelete.length}
                    onStatusUpdate={handleBulkStatusUpdate}
                    onExportSelected={handleBulkExport}
                    onDelete={() => setShowDeleteDialog(true)}
                  />
                  
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 w-full lg:w-auto text-xs">
                        Create Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] mx-4">
                      <DialogHeader>
                        <DialogTitle className="text-lg">Create Onboarding Link</DialogTitle>
                        <DialogDescription className="text-sm">
                          Generate a personalized onboarding link for your client. They'll receive an email with the link automatically.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-4 py-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="client_name" className="text-xs font-medium">Client Name *</Label>
                          <Input
                            id="client_name"
                            placeholder="John Doe"
                            className="h-8 text-sm"
                            value={newClient.client_name}
                            onChange={(e) => setNewClient(prev => ({ ...prev, client_name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="company_name" className="text-xs font-medium">Company Name *</Label>
                          <Input
                            id="company_name"
                            placeholder="ABC Company"
                            className="h-8 text-sm"
                            value={newClient.company_name}
                            onChange={(e) => setNewClient(prev => ({ ...prev, company_name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-xs font-medium">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@abccompany.com"
                            className="h-8 text-sm"
                            value={newClient.email}
                            onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="industry" className="text-xs font-medium">Industry</Label>
                          <Select value={newClient.industry} onValueChange={(value) => setNewClient(prev => ({ ...prev, industry: value }))}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                       <div className="flex justify-end">
                         <Button 
                           size="sm"
                           onClick={handleCreateLink}
                           disabled={!newClient.client_name || !newClient.company_name || !newClient.email}
                         >
                           Create Link
                         </Button>
                       </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </header>

            {/* Compact Client Links */}
            <Card>
                <CardContent className="p-0">
                    <div className="border-b border-border px-4 py-3">
                      {/* Select All and Tabs Row with Controls */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={toggleAllSelection}
                            className="flex items-center justify-center w-5"
                          >
                            <div className={`border flex min-h-5 w-5 h-5 rounded-md border-solid border-border items-center justify-center ${
                              selectedForDelete.length === getFilteredClientLinks().length && getFilteredClientLinks().length > 0 ? 'bg-primary border-primary' : 'bg-background'
                            }`}>
                              {selectedForDelete.length === getFilteredClientLinks().length && getFilteredClientLinks().length > 0 && (
                                <Check size={12} className="text-primary-foreground" />
                              )}
                            </div>
                          </button>
                          {selectedForDelete.length > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {selectedForDelete.length} selected
                            </span>
                          )}
                          
                          {/* Tab Navigation */}
                          <div className="overflow-x-auto">
                            <div className="border shadow-sm flex overflow-hidden text-xs text-foreground font-medium leading-none rounded-md border-border min-w-max">
                              {['View all', 'Sent', 'In Progress', 'Completed', 'SOW Generated', 'Approved'].map((tab, index) => {
                                const isActive = activeFilter === tab;
                                const isFirst = index === 0;
                                const isLast = index === 5;
                                return (
                                  <button
                                    key={tab}
                                    onClick={() => setActiveFilter(tab)}
                                    className={`px-3 py-2 ${
                                      isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card hover:bg-accent'
                                    } ${
                                      isFirst ? 'rounded-l-md' : ''
                                    } ${
                                      isLast ? 'rounded-r-md' : ''
                                    } ${
                                      !isLast ? 'border-r border-border' : ''
                                    } transition-colors`}
                                  >
                                    {tab}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Filter and Settings */}
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            <FilterLines className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            <Settings01 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                {clientLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No client links yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      Create your first onboarding link to start managing client intake workflow.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Onboarding Link
                    </Button>
                  </div>
                 ) : (
                   <div className="divide-y divide-border">
                     {getFilteredClientLinks().map((link) => (
                      <div key={link.id} className="px-4 py-4">
                        <div className="flex items-start gap-3">
                           <button
                             onClick={() => toggleSelection(link.id)}
                             className="flex items-center justify-center w-5 mt-1"
                           >
                             <div className={`border flex min-h-5 w-5 h-5 rounded-md border-solid border-border items-center justify-center ${
                               selectedForDelete.includes(link.id) ? 'bg-primary border-primary' : 'bg-background'
                             }`}>
                               {selectedForDelete.includes(link.id) && (
                                 <Check size={12} className="text-primary-foreground" />
                               )}
                             </div>
                           </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-medium text-card-foreground truncate">
                                    {link.client_name}
                                  </h3>
                                  <Badge variant="default" className="text-xs px-1.5 py-0.5">
                                    {link.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1 truncate">
                                  {link.company_name} • {link.email} • {link.industry}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Created {formatDate(link.date_sent)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyToClipboard(link.onboarding_url)}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendEmail(link)}
                                  disabled={sendingEmail === link.id}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Send className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewOnboarding(link.onboarding_url)}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-4 mb-6 space-y-3">
                              <ProgressBar 
                                percentage={getProgressPercentage(link.status)} 
                                className="h-1.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Onboarding Links"
        description={`Are you sure you want to delete ${selectedForDelete.length} client link(s)? This action cannot be undone.`}
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

export default Onboarding;