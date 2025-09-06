import React, { useState } from 'react';
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

const Team = () => {
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('member');

  const handleInvite = () => {
    if (!inviteEmail) return;
    
    // Mock invite logic
    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${inviteEmail}`,
    });
    
    setInviteEmail('');
    setInviteRole('member');
    setIsInviteOpen(false);
  };

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'admin':
        return 'complete';
      case 'manager':
        return 'in-review';
      case 'member':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active':
        return 'complete';
      case 'pending':
        return 'in-review';
      case 'inactive':
        return 'incomplete';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            {/* Header */}
            <header className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold leading-tight mb-1">
                    Team Members
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your team members and their access levels
                  </p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
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
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as TeamMember['role'])}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
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

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members ({teamMembers.length})</CardTitle>
                <CardDescription>
                  Manage team members and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getRoleColor(member.role)} className="capitalize">
                          {member.role}
                        </Badge>
                        <Badge variant={getStatusColor(member.status)} className="capitalize">
                          {member.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Role</DropdownMenuItem>
                            <DropdownMenuItem>Resend Invitation</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

export default Team;