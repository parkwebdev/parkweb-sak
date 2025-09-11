import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  company: string;
  industry: string;
  status: 'active' | 'onboarding' | 'completed' | 'inactive';
  onboarding_status: string;
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  scope_of_works: number;
  last_activity: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  notes?: string;
  onboarding_url?: string;
  personal_note?: string;
  folder_id?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [folders, setFolders] = useState<ClientFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      // Fetch all client data from different tables including folders
      const [
        { data: activeClients, error: clientsError },
        { data: onboardingLinks, error: onboardingError },
        { data: submissions, error: submissionsError },
        { data: requests, error: requestsError },
        { data: scopeOfWorks, error: sowError },
        { data: folders, error: foldersError },
        { data: folderAssignments, error: assignmentsError }
      ] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', userId),
        supabase.from('client_onboarding_links').select('*').eq('user_id', userId),
        supabase.from('onboarding_submissions').select('*'),
        supabase.from('requests').select('*').eq('user_id', userId),
        supabase.from('scope_of_works').select('*').eq('user_id', userId),
        supabase.from('client_folders').select('*').eq('user_id', userId),
        supabase.from('client_folder_assignments').select('*')
      ]);

      if (clientsError || onboardingError || submissionsError || requestsError || sowError || foldersError || assignmentsError) {
        console.error('Error fetching client data:', { 
          clientsError, onboardingError, submissionsError, requestsError, sowError, foldersError, assignmentsError 
        });
        return;
      }

      // Set folders data
      setFolders(folders || []);

      // Aggregate client data by email
      const clientMap = new Map<string, Client>();

      // Process active clients (primary source - these are actual clients)
      activeClients?.forEach(client => {
        // Find folder assignment for this client
        const folderAssignment = folderAssignments?.find(fa => fa.client_email === client.email);

        clientMap.set(client.email, {
          id: client.id,
          email: client.email,
          name: client.client_name,
          company: client.company_name,
          industry: client.industry,
          status: client.status as Client['status'],
          onboarding_status: 'completed', // Active clients have completed onboarding
          total_requests: 0,
          active_requests: 0,
          completed_requests: 0,
          scope_of_works: 0,
          last_activity: client.updated_at,
          created_at: client.created_at,
          personal_note: client.personal_note,
          folder_id: folderAssignment?.folder_id,
          phone: client.phone,
          notes: client.personal_note
        });
      });

      // Process onboarding links (prospects going through onboarding)
      onboardingLinks?.forEach(link => {
        // Only add if not already in active clients
        if (!clientMap.has(link.email)) {
          const lastActivity = new Date(Math.max(
            new Date(link.last_activity || link.created_at).getTime(),
            new Date(link.updated_at).getTime()
          ));

          // Find folder assignment for this client
          const folderAssignment = folderAssignments?.find(fa => fa.client_email === link.email);

          clientMap.set(link.email, {
            id: link.id,
            email: link.email,
            name: link.client_name,
            company: link.company_name,
            industry: link.industry,
            status: getClientStatus(link.status),
            onboarding_status: link.status,
            total_requests: 0,
            active_requests: 0,
            completed_requests: 0,
            scope_of_works: 0,
            last_activity: lastActivity.toISOString(),
            created_at: link.created_at,
            onboarding_url: link.onboarding_url,
            personal_note: link.personal_note,
            folder_id: folderAssignment?.folder_id
          });
        }
      });

      // Process submissions to update client data
      submissions?.forEach(submission => {
        const existingClient = clientMap.get(submission.client_email);
        if (existingClient) {
          // Update with submission data if more recent
          const submissionDate = new Date(submission.submitted_at);
          const lastActivityDate = new Date(existingClient.last_activity);
          
          if (submissionDate > lastActivityDate) {
            existingClient.last_activity = submission.submitted_at;
          }
          
          // Update status if submission is more recent
          if (submission.status && submissionDate > lastActivityDate) {
            existingClient.onboarding_status = submission.status;
            existingClient.status = getClientStatus(submission.status);
          }
        } else {
          // Create new client from submission
          const folderAssignment = folderAssignments?.find(fa => fa.client_email === submission.client_email);
          
          clientMap.set(submission.client_email, {
            id: submission.id,
            email: submission.client_email,
            name: submission.client_name,
            company: submission.client_email.split('@')[1]?.split('.')[0] || 'Unknown',
            industry: submission.industry || 'Unknown',
            status: getClientStatus(submission.status),
            onboarding_status: submission.status || 'pending',
            total_requests: 0,
            active_requests: 0,
            completed_requests: 0,
            scope_of_works: 0,
            last_activity: submission.submitted_at,
            created_at: submission.submitted_at,
            folder_id: folderAssignment?.folder_id
          });
        }
      });

      // Process requests to update counters
      requests?.forEach(request => {
        const client = clientMap.get(request.client_email);
        if (client) {
          client.total_requests++;
          
          if (request.status === 'completed') {
            client.completed_requests++;
          } else {
            client.active_requests++;
          }

          // Update last activity if request is more recent
          const requestDate = new Date(request.updated_at);
          const lastActivityDate = new Date(client.last_activity);
          
          if (requestDate > lastActivityDate) {
            client.last_activity = request.updated_at;
          }
        }
      });

      // Process scope of works to update counters
      scopeOfWorks?.forEach(sow => {
        const client = clientMap.get(sow.email);
        if (client) {
          client.scope_of_works++;

          // Update last activity if SOW is more recent
          const sowDate = new Date(sow.updated_at);
          const lastActivityDate = new Date(client.last_activity);
          
          if (sowDate > lastActivityDate) {
            client.last_activity = sow.updated_at;
          }
        }
      });

      // Convert map to array and sort by last activity
      const clientsArray = Array.from(clientMap.values()).sort((a, b) => 
        new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
      );

      setClients(clientsArray);
    } catch (error) {
      console.error('Error in fetchClients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientStatus = (onboardingStatus: string): Client['status'] => {
    switch (onboardingStatus?.toLowerCase()) {
      case 'completed':
      case 'sow generated':
      case 'approved':
        return 'completed';
      case 'in progress':
        return 'onboarding';
      case 'sent':
        return 'onboarding';
      default:
        return 'active';
    }
  };

  useEffect(() => {
    fetchClients();

    // Set up real-time subscriptions
    const clientsSubscription = supabase
      .channel('clients-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clients' },
        () => fetchClients()
      )
      .subscribe();

    const onboardingSubscription = supabase
      .channel('client-onboarding-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'client_onboarding_links' },
        () => fetchClients()
      )
      .subscribe();

    const requestsSubscription = supabase
      .channel('client-requests-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => fetchClients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(clientsSubscription);
      supabase.removeChannel(onboardingSubscription);
      supabase.removeChannel(requestsSubscription);
    };
  }, []);

  return {
    clients,
    folders,
    loading,
    refetch: fetchClients
  };
};