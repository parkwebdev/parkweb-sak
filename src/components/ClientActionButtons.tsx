import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Send01 as Send, Check, Copy01 as Copy, Edit01 as Edit, Download01 as Download, Plus } from '@untitledui/icons';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { INDUSTRY_OPTIONS } from '@/lib/constants';
import { createOnboardingUrl, copyToClipboard } from '@/lib/form-helpers';
import { useAuth } from '@/contexts/AuthContext';

interface ClientActionButtonsProps {
  activeTab: string;
  onRefresh?: () => void;
}

export const ClientActionButtons: React.FC<ClientActionButtonsProps> = ({ 
  activeTab, 
  onRefresh 
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    client_name: '',
    company_name: '',
    email: '',
    industry: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendWelcomeEmail } = useEmailTemplates();

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
      
      // Refresh the data
      onRefresh?.();
      
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

  // Show create button for links-invitations tab
  if (activeTab === 'links-invitations') {
    return (
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button size="sm" className="ml-auto">
            <Plus size={16} className="mr-2" />
            Create Link
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Onboarding Link</DialogTitle>
            <DialogDescription>
              Generate a personalized onboarding link for your client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                placeholder="Enter client's full name"
                value={newClient.client_name}
                onChange={(e) => setNewClient(prev => ({ ...prev, client_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                placeholder="Enter company name"
                value={newClient.company_name}
                onChange={(e) => setNewClient(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@company.com"
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Select 
                value={newClient.industry} 
                onValueChange={(value) => setNewClient(prev => ({ ...prev, industry: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLink}
              disabled={!newClient.client_name || !newClient.company_name || !newClient.email || !newClient.industry}
            >
              Create Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

// Individual row action buttons for different data types
export const RowActionButtons: React.FC<{
  item: any;
  activeTab: string;
  onRefresh?: () => void;
}> = ({ item, activeTab, onRefresh }) => {
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();
  const { sendWelcomeEmail } = useEmailTemplates();

  const handleCopyToClipboard = async (url: string) => {
    let fullUrl = url;
    if (!fullUrl.startsWith('http')) {
      fullUrl = `${window.location.origin}${url}`;
    } else {
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

  const handleSendEmail = async (clientData: any) => {
    setSendingEmail(true);
    
    try {
      let fullUrl = clientData.onboarding_url;
      if (!fullUrl.startsWith('http')) {
        fullUrl = `${window.location.origin}${fullUrl}`;
      } else {
        const urlObj = new URL(fullUrl);
        const currentOrigin = window.location.origin;
        fullUrl = `${currentOrigin}${urlObj.pathname}${urlObj.search}`;
      }
      
      const emailResult = await sendWelcomeEmail(
        clientData.client_name,
        clientData.company_name,
        clientData.email,
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
          description: `Welcome email sent to ${clientData.email}`,
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
      setSendingEmail(false);
    }
  };

  const handleViewOnboarding = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    window.open(fullUrl, '_blank');
  };

  const handleApproveSOW = async (itemData: any) => {
    try {
      if (activeTab === 'links-invitations') {
        // Update onboarding link status
        const { error: updateError } = await supabase
          .from('client_onboarding_links')
          .update({
            status: 'Approved',
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', itemData.id);

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
              to: itemData.email,
              variables: {
                client_name: itemData.client_name,
                company_name: itemData.company_name
              }
            }
          });

          if (emailError) {
            console.error('Error sending completion email:', emailError);
          }
        } catch (emailError) {
          console.error('Error sending completion email:', emailError);
        }

        onRefresh?.();
        
        toast({
          title: "SOW Approved",
          description: `SOW approved for ${itemData.client_name}. Completion email sent.`,
        });
      } else if (activeTab === 'submissions-sows') {
        // Update SOW status
        const { data: updateData, error: updateError } = await supabase
          .from('scope_of_works')
          .update({
            status: 'Approved',
            date_modified: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', itemData.id)
          .select();

        if (updateError) {
          toast({
            title: "Error",
            description: "Failed to approve SOW. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Send approval email
        try {
          const { error: emailError } = await supabase.functions.invoke('send-stage-email', {
            body: {
              templateName: 'sow_approval',
              clientEmail: itemData.email,
              variables: {
                client_name: itemData.client,
                company_name: itemData.client,
                sow_title: itemData.title
              }
            }
          });

          if (emailError) {
            console.error('Error sending approval email:', emailError);
          }
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }

        onRefresh?.();
        
        toast({
          title: "SOW Approved",
          description: `SOW approved for ${itemData.client}. Approval email sent.`,
        });
      }
    } catch (error) {
      console.error('Error approving SOW:', error);
      toast({
        title: "Error",
        description: "Failed to approve SOW. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (activeTab === 'links-invitations') {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewOnboarding(item.onboarding_url)}
          className="h-8 w-8 p-0"
        >
          <Eye size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopyToClipboard(item.onboarding_url)}
          className="h-8 w-8 p-0"
        >
          <Copy size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSendEmail(item)}
          disabled={sendingEmail}
          className="h-8 w-8 p-0"
        >
          <Send size={16} />
        </Button>
        {(item.status === 'SOW Generated' || item.sow_status === 'Generated') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleApproveSOW(item)}
            className="h-8 w-8 p-0 text-success hover:text-success"
          >
            <Check size={16} />
          </Button>
        )}
      </div>
    );
  }

  if (activeTab === 'submissions-sows') {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Eye size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Edit size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Download size={16} />
        </Button>
        {item.status !== 'Approved' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleApproveSOW(item)}
            className="h-8 w-8 p-0 text-success hover:text-success"
          >
            <Check size={16} />
          </Button>
        )}
      </div>
    );
  }

  // Default actions for completed and all-clients tabs
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
      >
        <Eye size={16} />
      </Button>
    </div>
  );
};