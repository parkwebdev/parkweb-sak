import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Plus, Link2, Copy, Send, User, FileText, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { INDUSTRY_OPTIONS } from '@/lib/constants';
import { getStatusColor, formatDate } from '@/lib/status-helpers';
import { createOnboardingUrl, createEmailTemplate, openEmailClient, copyToClipboard } from '@/lib/form-helpers';

interface ClientLink {
  id: string;
  clientName: string;
  companyName: string;
  email: string;
  industry: string;
  status: 'Sent' | 'In Progress' | 'Completed' | 'SOW Generated' | 'Approved';
  dateSent: string;
  lastActivity: string;
  onboardingUrl: string;
  sowStatus?: 'Draft' | 'Client Review' | 'Agency Review' | 'Approved';
}

const clientLinks: ClientLink[] = [
  {
    id: '1',
    clientName: 'Sarah Johnson',
    companyName: 'Mountain View RV Park',
    email: 'sarah@mountainviewrv.com',
    industry: 'RV Park',
    status: 'SOW Generated',
    dateSent: '2024-01-15',
    lastActivity: '2024-01-16',
    onboardingUrl: '/client-onboarding?name=Sarah%20Johnson&company=Mountain%20View%20RV%20Park&token=abc123',
    sowStatus: 'Client Review'
  },
  {
    id: '2',
    clientName: 'Michael Chen',
    companyName: 'Sunset Manufacturing',
    email: 'michael@sunsetmfg.com',
    industry: 'Manufactured Home Community',
    status: 'In Progress',
    dateSent: '2024-01-12',
    lastActivity: '2024-01-14',
    onboardingUrl: '/client-onboarding?name=Michael%20Chen&company=Sunset%20Manufacturing&token=def456'
  },
  {
    id: '3',
    clientName: 'Jessica Rodriguez',
    companyName: 'Elite Capital Partners',
    email: 'jessica@elitecapital.com',
    industry: 'Capital & Syndication',
    status: 'Sent',
    dateSent: '2024-01-10',
    lastActivity: '2024-01-10',
    onboardingUrl: '/client-onboarding?name=Jessica%20Rodriguez&company=Elite%20Capital%20Partners&token=ghi789'
  }
];

const Onboarding = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    clientName: '',
    companyName: '',
    email: '',
    industry: '',
    personalNote: ''
  });
  const { toast } = useToast();

  const handleCreateLink = () => {
    const onboardingUrl = createOnboardingUrl(newClient.clientName, newClient.companyName);
    
    // Reset form
    setNewClient({
      clientName: '',
      companyName: '',
      email: '',
      industry: '',
      personalNote: ''
    });
    setShowCreateDialog(false);
    
    toast({
      title: "Onboarding link created!",
      description: "The personalized onboarding link has been generated and copied to clipboard.",
    });
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

  const handleSendEmail = (client: ClientLink) => {
    const fullUrl = window.location.origin + client.onboardingUrl;
    const { subject, body } = createEmailTemplate(client.clientName, client.companyName, fullUrl);
    openEmailClient(client.email, subject, body);
  };

  // Remove the old getStatusColor function since it's now imported from utils

  return (
    <div className="flex h-screen bg-muted/30">
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar />
      </div>
      <div className="flex-1 ml-[280px] overflow-auto">
        <main className="flex-1 bg-muted/30 pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-8">
            {/* Compact Header */}
            <header className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold leading-tight mb-1">
                    Client Onboarding
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Generate personalized onboarding links and manage client intake workflow
                  </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8">
                      <Plus className="h-3 w-3 mr-1.5" />
                      Create Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Create Onboarding Link</DialogTitle>
                      <DialogDescription className="text-sm">
                        Generate a custom onboarding link for your client with their information pre-filled.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="clientName" className="text-xs font-medium">Client Name *</Label>
                          <Input
                            id="clientName"
                            placeholder="John Smith"
                            className="h-8 text-sm"
                            value={newClient.clientName}
                            onChange={(e) => setNewClient(prev => ({ ...prev, clientName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="companyName" className="text-xs font-medium">Company Name *</Label>
                          <Input
                            id="companyName"
                            placeholder="ABC Company"
                            className="h-8 text-sm"
                            value={newClient.companyName}
                            onChange={(e) => setNewClient(prev => ({ ...prev, companyName: e.target.value }))}
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
                          value={newClient.personalNote}
                          onChange={(e) => setNewClient(prev => ({ ...prev, personalNote: e.target.value }))}
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
                        disabled={!newClient.clientName || !newClient.companyName || !newClient.email}
                      >
                        Create Link
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            {/* Compact Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="compact-card">
                <CardContent className="compact-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Total Links</p>
                      <p className="text-xl font-semibold">12</p>
                    </div>
                    <Link2 className="h-5 w-5 text-info" />
                  </div>
                </CardContent>
              </Card>
              <Card className="compact-card">
                <CardContent className="compact-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                      <p className="text-xl font-semibold">5</p>
                    </div>
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                </CardContent>
              </Card>
              <Card className="compact-card">
                <CardContent className="compact-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">SOW Generated</p>
                      <p className="text-xl font-semibold">3</p>
                    </div>
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="compact-card">
                <CardContent className="compact-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Approved</p>
                      <p className="text-xl font-semibold">4</p>
                    </div>
                    <User className="h-5 w-5 text-success" />
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
                 <div className="divide-y divide-border">
                   {clientLinks.map((client) => (
                     <div key={client.id} className="p-6 hover:bg-muted/50 transition-colors">
                       <div className="flex items-start justify-between gap-4">
                         <div className="flex-1 min-w-0">
                           <div className="flex items-start gap-3 mb-3">
                             <div className="min-w-0 flex-1">
                               <h3 className="font-medium text-base truncate mb-1">{client.companyName}</h3>
                               <p className="text-sm text-muted-foreground truncate">
                                 <a 
                                   href={`mailto:${client.email}`}
                                   className="hover:underline"
                                 >
                                   {client.clientName}
                                 </a>
                                 <span className="mx-2">•</span>
                                 <a 
                                   href={`mailto:${client.email}`}
                                   className="hover:underline"
                                 >
                                   {client.email}
                                 </a>
                               </p>
                             </div>
                             <div className="flex items-center gap-2 flex-shrink-0">
                               <Badge className={`${getStatusColor(client.status)} border text-xs px-2.5 py-1 w-auto`}>
                                 {client.status}
                               </Badge>
                               {client.sowStatus && (
                                 <Badge variant="outline" className="text-xs px-2.5 py-1 w-auto border">
                                   SOW: {client.sowStatus}
                                 </Badge>
                               )}
                             </div>
                           </div>
                           <div className="flex items-center gap-6 text-sm text-muted-foreground">
                             <span>Industry: {client.industry}</span>
                             <span>Sent: {formatDate(client.dateSent)}</span>
                             <span>Last Activity: {formatDate(client.lastActivity)}</span>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleCopyToClipboard(client.onboardingUrl)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleSendEmail(client)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          {client.sowStatus && (
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Onboarding;