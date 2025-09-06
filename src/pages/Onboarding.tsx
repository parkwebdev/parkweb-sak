import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Plus, Link2, Copy, Send, User, Building2, Calendar, Clock } from 'lucide-react';
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
      <div className="flex-1 ml-[296px] overflow-auto">
        <main className="flex-1 bg-muted/20 pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-8">
            <header className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-foreground text-3xl font-semibold leading-8 tracking-tight mb-2">
                    Client Onboarding Management
                  </h1>
                  <p className="text-muted-foreground">
                    Generate personalized onboarding links and manage client intake workflow
                  </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Onboarding Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create Personalized Onboarding Link</DialogTitle>
                      <DialogDescription>
                        Generate a custom onboarding link for your client with their information pre-filled.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="clientName">Client Name *</Label>
                          <Input
                            id="clientName"
                            placeholder="John Smith"
                            value={newClient.clientName}
                            onChange={(e) => setNewClient(prev => ({ ...prev, clientName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="companyName">Company Name *</Label>
                          <Input
                            id="companyName"
                            placeholder="ABC Company"
                            value={newClient.companyName}
                            onChange={(e) => setNewClient(prev => ({ ...prev, companyName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@abccompany.com"
                          value={newClient.email}
                          onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Select value={newClient.industry} onValueChange={(value) => setNewClient(prev => ({ ...prev, industry: value }))}>
                          <SelectTrigger>
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
                      <div>
                        <Label htmlFor="personalNote">Personal Note (Optional)</Label>
                        <Textarea
                          id="personalNote"
                          placeholder="Add a personal message that will be included in the email"
                          value={newClient.personalNote}
                          onChange={(e) => setNewClient(prev => ({ ...prev, personalNote: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Links</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <Link2 className="h-8 w-8 text-info" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">5</p>
                    </div>
                    <Clock className="h-8 w-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">SOW Generated</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold">4</p>
                    </div>
                    <User className="h-8 w-8 text-success" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client Links Table */}
            <Card>
              <CardHeader>
                <CardTitle>Client Onboarding Links</CardTitle>
                <CardDescription>
                  Manage all your client onboarding links and track their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientLinks.map((client) => (
                    <div key={client.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{client.companyName}</h3>
                              <p className="text-sm text-muted-foreground">{client.clientName} • {client.email}</p>
                            </div>
                            <Badge className={`${getStatusColor(client.status)} border`}>
                              {client.status}
                            </Badge>
                            {client.sowStatus && (
                              <Badge variant="outline">
                                SOW: {client.sowStatus}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Industry: {client.industry}</span>
                            <span>Sent: {formatDate(client.dateSent)}</span>
                            <span>Last Activity: {formatDate(client.lastActivity)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyToClipboard(client.onboardingUrl)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendEmail(client)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Email
                          </Button>
                          {client.sowStatus && (
                            <Button size="sm">
                              View SOW
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