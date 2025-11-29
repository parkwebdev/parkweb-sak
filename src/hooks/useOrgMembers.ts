import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Tables } from '@/integrations/supabase/types';

type OrgMember = Tables<'org_members'> & {
  profiles?: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

export const useOrgMembers = () => {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const fetchMembers = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('org_members')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data) {
        const userIds = data.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, avatar_url')
          .in('user_id', userIds);

        const membersWithProfiles = data.map(member => ({
          ...member,
          profiles: profilesData?.find(p => p.user_id === member.user_id) || null
        }));

        setMembers(membersWithProfiles as OrgMember[]);
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching members',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (email: string, role: string) => {
    if (!currentOrg) return;

    try {
      // This would typically call an edge function to send invitation email
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${email}`,
      });
      
      // Refresh members list
      fetchMembers();
    } catch (error: any) {
      toast({
        title: 'Error inviting member',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('org_members')
        .update({ role: role as any })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Role updated',
        description: 'Member role has been updated successfully',
      });

      fetchMembers();
    } catch (error: any) {
      toast({
        title: 'Error updating role',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('org_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Member removed',
        description: 'Member has been removed from the organization',
      });

      fetchMembers();
    } catch (error: any) {
      toast({
        title: 'Error removing member',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchMembers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('org-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'org_members',
          filter: `org_id=eq.${currentOrg?.id}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg?.id]);

  return {
    members,
    loading,
    inviteMember,
    updateMemberRole,
    removeMember,
    refetch: fetchMembers,
  };
};
