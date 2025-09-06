import React, { useState, useEffect } from 'react';
import { Plus, Mail01 as Mail, X, Settings01 as Settings } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RoleManagementDialog } from './RoleManagementDialog';

interface TeamMember {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  permissions?: string[];
}

export const TeamSettings: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTeamMembers();
    fetchCurrentUserRole();
  }, []);

  const fetchCurrentUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        return;
      }

      setCurrentUserRole(data?.role || 'member');
    } catch (error) {
      console.error('Error in fetchCurrentUserRole:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
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

      // Fetch roles for all members
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, permissions');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Combine profile and role data
      const membersWithRoles = (profilesData || []).map(profile => {
        const roleData = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: roleData?.role || 'member',
          permissions: roleData?.permissions || [],
        };
      });

      setTeamMembers(membersWithRoles);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: inviteEmail,
          type: 'team_invitation',
          title: 'Team Invitation',
          message: `You've been invited to join our team! Click the link below to get started.`,
          data: {
            invited_by: user?.email || 'Team Admin',
          }
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
      console.error('Error in handleInviteMember:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
    }
  };

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    setIsRoleDialogOpen(true);
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const canManageRoles = ['admin', 'super_admin'].includes(currentUserRole);

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg bg-background gap-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto ml-auto">
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to a new team member via email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteMember}>
                  <Mail size={16} className="mr-2" />
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg bg-background gap-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback>
                  {member.display_name 
                    ? member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
                    : member.email?.substring(0, 2).toUpperCase() || 'U'
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {member.display_name || member.email?.split('@')[0] || 'Unknown User'}
                </h3>
                <p className="text-xs text-muted-foreground">{member.email}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {formatJoinDate(member.created_at)}
                </p>
              </div>
            </div>
            
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
                <Badge className={`text-xs capitalize ${getRoleColor(member.role || 'member')}`}>
                  {member.user_id === user?.id 
                    ? (
                        member.role === 'super_admin' ? 'Super Admin (You)' :
                        member.role === 'admin' ? 'Admin (You)' : 
                        `${member.role || 'Member'} (You)`
                      )
                    : (
                        member.role === 'super_admin' ? 'Super Admin' :
                        member.role || 'Member'
                      )
                  }
                </Badge>
                {canManageRoles && member.user_id !== user?.id && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditRole(member)}
                    className="h-6 px-2"
                  >
                    <Settings size={12} className="mr-1" />
                    Edit
                  </Button>
                )}
              </div>
          </div>
        ))}
        
        {teamMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No team members found.
          </div>
        )}
      </div>

      <RoleManagementDialog
        member={selectedMember}
        isOpen={isRoleDialogOpen}
        onClose={() => {
          setIsRoleDialogOpen(false);
          setSelectedMember(null);
        }}
        onUpdate={() => {
          fetchTeamMembers();
          fetchCurrentUserRole();
        }}
      />
    </div>
  );
};