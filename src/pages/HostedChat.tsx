import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HostedChatInterface } from '@/components/chat/HostedChatInterface';

interface OrgBranding {
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  hide_powered_by: boolean | null;
}

interface Agent {
  id: string;
  name: string;
  description: string | null;
  deployment_config: any;
}

export default function HostedChat() {
  const { orgSlug, agentSlug } = useParams<{ orgSlug: string; agentSlug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<OrgBranding | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [orgName, setOrgName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!orgSlug || !agentSlug) {
        setError('Invalid URL');
        setLoading(false);
        return;
      }

      try {
        // Fetch organization by slug
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('slug', orgSlug)
          .single();

        if (orgError) throw new Error('Organization not found');

        setOrgName(org.name);

        // Fetch branding
        const { data: brandingData, error: brandingError } = await supabase
          .from('org_branding')
          .select('logo_url, primary_color, secondary_color, hide_powered_by')
          .eq('org_id', org.id)
          .maybeSingle();

        if (brandingError && brandingError.code !== 'PGRST116') {
          console.error('Error fetching branding:', brandingError);
        }

        setBranding(brandingData);

        // Fetch agent by name/slug and org
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('id, name, description, deployment_config')
          .eq('org_id', org.id)
          .eq('status', 'active')
          .ilike('name', agentSlug.replace(/-/g, ' '))
          .single();

        if (agentError) throw new Error('Agent not found');

        setAgent(agentData);
      } catch (err: any) {
        console.error('Error loading chat:', err);
        setError(err.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgSlug, agentSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Chat Not Found</h1>
          <p className="text-muted-foreground">{error || 'This chat is not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <HostedChatInterface
      agent={agent}
      branding={branding}
      orgName={orgName}
    />
  );
}
