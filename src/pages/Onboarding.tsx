import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Plus, Link01 as Link2, Copy01 as Copy, Send01 as Send, User01 as User, File02 as FileText, Clock as Clock, Eye as Eye } from '@untitledui/icons';
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
import { ProgressBar } from '@/components/ProgressBar';
import { useSidebar } from '@/hooks/use-sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  const [clientLinks, setClientLinks] = useState<ClientLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    client_name: '',
    company_name: '',
    email: '',
    industry: '',
    personal_note: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

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
          personal_note: newClient.personal_note,
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

      // Reset form
      setNewClient({
        client_name: '',
        company_name: '',
        email: '',
        industry: '',
        personal_note: ''
      });
      setShowCreateDialog(false);
      
      // Refresh the list
      fetchClientLinks();
      
      toast({
        title: "Onboarding link created!",
        description: "The personalized onboarding link has been generated.",
      });
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
    const fullUrl = window.location.origin + url;
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

  const handleSendEmail = async (client: ClientLink) => {
    try {
      setSendingEmail(client.id);
      const fullUrl = window.location.origin + createOnboardingUrl(client.client_name, client.company_name);
      
      console.log('Sending onboarding email to:', client.email, 'with URL:', fullUrl);
      
      const response = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: client.email,
          type: 'onboarding',
          title: 'Your Personalized Onboarding Portal',
          message: `Hi ${client.client_name},\n\nWe're excited to work with ${client.company_name} on your new website project!\n\nWe've created a personalized onboarding portal just for you. Please click the link below to get started:\n\n${fullUrl}\n\nThis will only take 10-15 minutes to complete and will help us create the perfect website for your business.\n\nIf you have any questions, feel free to reach out to us anytime.\n\nBest regards,\nThe Team`,
          data: {
            client_name: client.client_name,
            company_name: client.company_name,
            onboarding_url: fullUrl,
            personal_note: client.personal_note
          }
        }
      });

      console.log('Email API response:', response);

      if (response.error) {
        console.error('Email sending failed:', response.error);
        toast({
          title: "Failed to send email",
          description: "There was an error sending the onboarding email. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Email sent successfully to:', client.email);
      toast({
        title: "Email sent successfully!",
        description: `Onboarding email sent to ${client.email}`,
      });
    } catch (error) {
      console.error('Error sending onboarding email:', error);
      toast({
        title: "Failed to send email",
        description: "There was an error sending the onboarding email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(null);
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
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading client links...</p>
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
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
                
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 w-full lg:w-auto text-xs">
                      <Plus className="h-3 w-3 mr-1.5" />
                      Create Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px] mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Create Onboarding Link</DialogTitle>
                      <DialogDescription className="text-sm">
                        Generate a custom onboarding link for your client with their information pre-filled.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="clientName" className="text-xs font-medium">Client Name *</Label>
                          <Input
                            id="clientName"
                            placeholder="John Smith"
                            className="h-8 text-sm"
                            value={newClient.client_name}
                            onChange={(e) => setNewClient(prev => ({ ...prev, client_name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="companyName" className="text-xs font-medium">Company Name *</Label>
                          <Input
                            id="companyName"
                            placeholder="ABC Company"
                            className="h-8 text-sm"
                            value={newClient.company_name}
                            onChange={(e) => setNewClient(prev => ({ ...prev, company_name: e.target.value }))}
                          />
                        </div>
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
                      <div className="space-y-1.5">
                        <Label htmlFor="personalNote" className="text-xs font-medium">Personal Note (Optional)</Label>
                        <Textarea
                          id="personalNote"
                          placeholder="Add a personal message for the email"
                          className="min-h-[60px] text-sm resize-none"
                          value={newClient.personal_note}
                          onChange={(e) => setNewClient(prev => ({ ...prev, personal_note: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
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
            </header>

            {/* Compact Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="compact-card">
                <CardContent className="compact-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Total Links</p>
                      <p className="text-lg lg:text-xl font-semibold">{clientLinks.length}</p>
                    </div>
                    <Link2 className="h-4 w-4 lg:h-5 lg:w-5 text-info" />
                  </div>
                </CardContent>
              </Card>
              <Card className="compact-card">
                <CardContent className="compact-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                      <p className="text-lg lg:text-xl font-semibold">{clientLinks.filter(link => link.status === 'In Progress').length}</p>
                    </div>
                    <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-warning" />
                  </div>
                </CardContent>
              </Card>
              <Card className="compact-card">
                <CardContent className="compact-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">SOW Generated</p>
                      <p className="text-lg lg:text-xl font-semibold">{clientLinks.filter(link => link.status === 'SOW Generated').length}</p>
                    </div>
                    <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="compact-card">
                <CardContent className="compact-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Approved</p>
                      <p className="text-lg lg:text-xl font-semibold">{clientLinks.filter(link => link.status === 'Approved').length}</p>
                    </div>
                    <User className="h-4 w-4 lg:h-5 lg:w-5 text-success" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compact Client Links */}
            <Card>
              <CardHeader className="compact-header border-b">
                <CardTitle className="text-base">Client Onboarding Links</CardTitle>
                <CardDescription className="text-xs">
                  Manage all your client onboarding links and track their progress
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {clientLinks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Link2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No client links yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      Create your first onboarding link to start managing client intake workflow.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Link
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {clientLinks.map((client) => (
                      <div key={client.id} className="p-4 lg:p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-3 mb-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-base truncate mb-1">{client.company_name}</h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
                                  <span className="truncate">{client.client_name}</span>
                                  <span className="hidden sm:inline">•</span>
                                  <a 
                                    href={`mailto:${client.email}`}
                                    className="hover:underline truncate"
                                  >
                                    {client.email}
                                  </a>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={`${getStatusColor(client.status)} text-xs px-2.5 py-1 w-auto`}>
                                  {client.status}
                                </Badge>
                                {client.sow_status && (
                                  <Badge variant={client.sow_status === 'Approved' ? 'complete' : 'outline'} className="text-xs px-2.5 py-1 w-auto">
                                    SOW: {client.sow_status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mb-3">
                              <ProgressBar 
                                percentage={getProgressPercentage(client.status)} 
                                className="max-w-full lg:max-w-xs"
                              />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                              <span>Industry: {client.industry}</span>
                              <span>Sent: {formatDate(client.date_sent)}</span>
                              <span>Last: {formatDate(client.last_activity)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 flex-1 sm:flex-initial"
                              onClick={() => handleCopyToClipboard(client.onboarding_url)}
                            >
                              <Copy className="h-3 w-3" />
                              <span className="ml-1 sm:hidden">Copy</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 flex-1 sm:flex-initial"
                              onClick={() => handleSendEmail(client)}
                              disabled={sendingEmail === client.id}
                            >
                              {sendingEmail === client.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                              <span className="ml-1 sm:hidden">
                                {sendingEmail === client.id ? 'Sending...' : 'Send'}
                              </span>
                            </Button>
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
    </div>
  );
};

export default Onboarding;