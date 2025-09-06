import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const TeamSettings: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

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

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto ml-auto">
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
          <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-4">
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
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {member.user_id === user?.id ? 'You' : 'Member'}
                </Badge>
              </div>
          </div>
        ))}
        
        {teamMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No team members found.
          </div>
        )}
      </div>
    </div>
  );
};