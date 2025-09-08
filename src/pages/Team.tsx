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
import { ProfileEditDialog } from '@/components/team/ProfileEditDialog';
import { useSidebar } from '@/hooks/use-sidebar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/team';

const Team = () => {
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const { user } = useAuth();
  const { role: currentUserRole } = useRoleAuthorization();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  const isSuperAdmin = currentUserRole === 'super_admin';
  const canManageTeam = ['super_admin', 'admin'].includes(currentUserRole || '');

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team members...');
      setLoading(true);
      
      // Fetch profiles with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching team members:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load team members.",
          variant: "destructive",
        });
        return;
      }

      console.log('Profiles data:', profilesData);

      // Fetch roles for all members
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, permissions');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Fetch pending invitations
      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('Error fetching pending invitations:', pendingError);
      } else {
        console.log('Pending invitations:', pendingData);
        setPendingInvites(pendingData || []);
      }

      // Combine profile and role data
      const membersWithRoles = (profilesData || []).map(profile => {
        const roleData = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: roleData?.role || 'member',
        };
      });

      console.log('Team members with roles:', membersWithRoles);
      setTeamMembers(membersWithRoles);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !user) return;
    
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: inviteEmail,
          invitedBy: user.email || 'Team Admin',
          companyName: 'our team'
        }
      });

      if (error) {
        console.error('Error sending invitation:', error);
        toast({
          title: "Failed to send invitation",
          description: "There was an error sending the invitation email.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Invitation sent",
        description: `Team invitation sent to ${inviteEmail}`,
      });
      
      setInviteEmail('');
      setIsInviteOpen(false);
    } catch (error) {
      console.error('Error in handleInvite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleEditProfile = (member: TeamMember) => {
    setSelectedMember(member);
    setIsProfileDialogOpen(true);
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.display_name || member.email} from the team?`)) {
      return;
    }

    try {
      // Remove from user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', member.user_id);

      if (roleError) {
        console.error('Error removing user role:', roleError);
      }

      // Remove from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', member.user_id);

      if (profileError) {
        toast({
          title: "Remove failed",
          description: "Failed to remove team member.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Member removed",
        description: `${member.display_name || member.email} has been removed from the team.`,
      });

      // Refresh the team members list
      await fetchTeamMembers();
    } catch (error) {
      toast({
        title: "Remove failed", 
        description: "An error occurred while removing the team member.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePendingInvite = async (inviteId: string, email: string) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', inviteId);

      if (error) {
        toast({
          title: "Cancel failed",
          description: "Failed to cancel invitation.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Invitation cancelled",
        description: `Invitation for ${email} has been cancelled.`,
      });

      // Refresh the team members list
      await fetchTeamMembers();
    } catch (error) {
      toast({
        title: "Cancel failed", 
        description: "An error occurred while cancelling the invitation.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-muted/30">
        <div className="fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0">
          <Sidebar onShowShortcuts={() => {}} />
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
        <Sidebar onShowShortcuts={() => {}} />
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
                          placeholder="coworker@park-web.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleInvite} disabled={inviting}>
                          <Send className="h-4 w-4 mr-2" />
                          {inviting ? 'Sending...' : 'Send Invitation'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            <div className="space-y-4">
              {/* Pending Invitations */}
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="p-6 bg-background border-dashed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg bg-muted">
                          {invite.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-lg">{invite.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Invited by {invite.invited_by_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Sent {new Date(invite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="pending">
                        Pending
                      </Badge>
                      {canManageTeam && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                            <DropdownMenuItem 
                              className="text-destructive dark:text-red-400"
                              onClick={() => handleRemovePendingInvite(invite.id, invite.email)}
                            >
                              Cancel Invitation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Team Members */}
              {teamMembers.length === 0 && pendingInvites.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">No team members or invitations yet</h3>
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
                            {member.user_id === user?.id 
                              ? (member.role === 'super_admin' ? 'Super Admin (You)' :
                                 member.role === 'admin' ? 'Admin (You)' : 
                                 `${member.role || 'Member'} (You)`)
                              : (member.role === 'super_admin' ? 'Super Admin' :
                                 member.role || 'Member')}
                          </Badge>
                          {member.user_id !== user?.id && canManageTeam && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                                {isSuperAdmin && (
                                  <DropdownMenuItem onClick={() => handleEditProfile(member)}>
                                    Edit Profile
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-destructive dark:text-red-400"
                                  onClick={() => handleRemoveMember(member)}
                                >
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

        <ProfileEditDialog
          member={selectedMember}
          isOpen={isProfileDialogOpen}
          onClose={() => {
            setIsProfileDialogOpen(false);
            setSelectedMember(null);
          }}
          onUpdate={() => {
            console.log('🔄 Profile updated, refreshing team list...');
            fetchTeamMembers();
          }}
        />
      </div>
    );
  };

  export default Team;