import React, { useState } from 'react';
import { Plus, Mail01 as Mail, X } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Aaron Chachamovits',
    email: 'aaron@parkweb.app',
    role: 'admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'john@parkweb.app',
    role: 'manager',
    status: 'active',
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    email: 'sarah@parkweb.app',
    role: 'member',
    status: 'pending',
  },
];

export const TeamSettings: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member');
  const { toast } = useToast();

  const handleInviteMember = () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
    };

    setTeamMembers([...teamMembers, newMember]);
    setInviteEmail('');
    setInviteRole('member');
    setIsInviteOpen(false);

    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${inviteEmail}`,
    });
  };

  const handleRemoveMember = (memberId: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
    toast({
      title: "Member removed",
      description: "Team member has been removed successfully.",
    });
  };

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'manager' | 'member') => {
    setTeamMembers(teamMembers.map(member => 
      member.id === memberId ? { ...member, role: newRole } : member
    ));
    toast({
      title: "Role updated",
      description: "Team member role has been updated successfully.",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'manager': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'member': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'inactive': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-foreground mb-1">Team Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage team members and permissions
          </p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus size={16} className="mr-2" />
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
              <div className="space-y-1.5">
                <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
                <Select value={inviteRole} onValueChange={(value: 'admin' | 'manager' | 'member') => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
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

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({teamMembers.length})</CardTitle>
          <CardDescription>
            Manage team member roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
                  <div className="flex gap-2">
                    <Badge className={getRoleColor(member.role)}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Select 
                      value={member.role} 
                      onValueChange={(value: 'admin' | 'manager' | 'member') => handleRoleChange(member.id, value)}
                    >
                      <SelectTrigger className="flex-1 sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};