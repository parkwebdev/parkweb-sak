import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member';
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  loading: boolean;
  switchOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrg(null);
      setLoading(false);
    }
  }, [user]);

  const fetchOrganizations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch user's organizations
      const { data: memberships, error } = await supabase
        .from('org_members')
        .select('org_id, role, organizations(id, name, slug)')
        .eq('user_id', user.id);

      if (error) throw error;

      const orgs: Organization[] = (memberships || []).map(m => ({
        id: m.org_id,
        name: (m.organizations as any)?.name || 'Unknown',
        slug: (m.organizations as any)?.slug || 'unknown',
        role: m.role as 'owner' | 'admin' | 'member'
      }));

      setOrganizations(orgs);

      // Get saved org from localStorage or use first org
      const savedOrgId = localStorage.getItem('currentOrgId');
      const orgToSet = savedOrgId 
        ? orgs.find(o => o.id === savedOrgId) || orgs[0]
        : orgs[0];

      if (orgToSet) {
        setCurrentOrg(orgToSet);
        localStorage.setItem('currentOrgId', orgToSet.id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem('currentOrgId', orgId);
    }
  };

  const value = {
    currentOrg,
    organizations,
    loading,
    switchOrganization
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};
