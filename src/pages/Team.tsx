import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Send01 as Send, DotsHorizontal as MoreHorizontal } from '@untitledui/icons';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/hooks/use-sidebar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

const Team = () => {
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team members:', error);
        toast({
          title: "Error",
          description: "Failed to load team members.",
          variant: "destructive",
        });
        return;
      }

      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = () => {
    if (!inviteEmail) return;
    
    // TODO: Implement actual team invitation system with database
    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${inviteEmail}`,
    });
    
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-muted/30">
        <div className="fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0">
          <Sidebar />
        </div>
        
        <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
          isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
        }`}>
          <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
            <div className="max-w-6xl mx-auto px-4 lg:px-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 bg-background">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </Card>
                  ))}
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
      <div className="fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0">
        <Sidebar />
      </div>
      
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <header className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold leading-tight mb-1">
                    Team
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your team members and their access levels
                  </p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-xs">
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to a new team member
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="colleague@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleInvite}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Invitation
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            <div className="space-y-4">
              {teamMembers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by inviting team members to collaborate.
                      </p>
                      <Button onClick={() => setIsInviteOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Invite First Member
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                teamMembers.map((member) => {
                  const displayName = member.display_name || member.email?.split('@')[0] || 'User';
                  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  
                  return (
                    <Card key={member.id} className="p-6 bg-background">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar_url || ''} alt={displayName} />
                            <AvatarFallback className="text-lg">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-lg">{displayName}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Joined {new Date(member.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="complete" className="capitalize">
                            {member.user_id === user?.id ? 'You' : 'Member'}
                          </Badge>
                          {member.user_id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Send Message</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Team;