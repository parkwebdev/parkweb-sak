-- ChatPad Platform Migration (Final)
-- Phase 1: Database Foundation & Multi-Tenant Setup

-- ============================================
-- 0. DROP OLD TRIGGER AND FUNCTION WITH CASCADE
-- ============================================

DROP FUNCTION IF EXISTS public.log_role_change() CASCADE;

-- ============================================
-- 1. CREATE NEW ENUMS
-- ============================================

CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.agent_status AS ENUM ('draft', 'active', 'paused');
CREATE TYPE public.conversation_status AS ENUM ('active', 'human_takeover', 'closed');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted');
CREATE TYPE public.knowledge_type AS ENUM ('pdf', 'url', 'api', 'json', 'xml', 'csv');

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ============================================
-- 2. ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 3. CREATE CORE TABLES
-- ============================================

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role public.org_role DEFAULT 'member'::public.org_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(org_id, user_id)
);

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  price_monthly integer NOT NULL,
  price_yearly integer NOT NULL,
  features jsonb DEFAULT '{}'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.plans(id) NOT NULL,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text DEFAULT 'active' NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  system_prompt text NOT NULL,
  model text DEFAULT 'google/gemini-2.5-flash' NOT NULL,
  temperature float DEFAULT 0.7,
  max_tokens integer DEFAULT 2000,
  status public.agent_status DEFAULT 'draft'::public.agent_status NOT NULL,
  deployment_config jsonb DEFAULT '{"widget_enabled": false, "hosted_page_enabled": false, "api_enabled": false}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  type public.knowledge_type NOT NULL,
  source text NOT NULL,
  content text,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'processing' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  parameters jsonb NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(agent_id, name)
);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  status public.conversation_status DEFAULT 'active'::public.conversation_status NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '6 months') NOT NULL
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  name text,
  email text,
  phone text,
  company text,
  status public.lead_status DEFAULT 'new'::public.lead_status NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  events text[] DEFAULT '{}',
  headers jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  key_preview text NOT NULL,
  permissions text[] DEFAULT '{}',
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.conversation_takeovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  taken_over_by uuid NOT NULL,
  taken_over_at timestamptz DEFAULT now() NOT NULL,
  returned_to_ai_at timestamptz,
  reason text
);

CREATE TABLE public.org_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  logo_url text,
  primary_color text,
  secondary_color text,
  custom_domain text,
  hide_powered_by boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  conversations_count integer DEFAULT 0,
  messages_count integer DEFAULT 0,
  api_calls_count integer DEFAULT 0,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX idx_agents_org_id ON public.agents(org_id);
CREATE INDEX idx_knowledge_sources_agent_id ON public.knowledge_sources(agent_id);
CREATE INDEX idx_knowledge_sources_org_id ON public.knowledge_sources(org_id);
CREATE INDEX idx_conversations_org_id ON public.conversations(org_id);
CREATE INDEX idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_leads_org_id ON public.leads(org_id);
CREATE INDEX idx_webhooks_org_id ON public.webhooks(org_id);
CREATE INDEX idx_api_keys_org_id ON public.api_keys(org_id);

CREATE INDEX idx_knowledge_sources_embedding ON public.knowledge_sources 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 5. CREATE SECURITY FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_super_admin.user_id
    AND role = 'super_admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(user_id uuid, org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.user_id = is_org_admin.user_id
    AND org_members.org_id = is_org_admin.org_id
    AND role IN ('owner'::public.org_role, 'admin'::public.org_role)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_role(user_id uuid, org_id uuid)
RETURNS public.org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.org_members
  WHERE org_members.user_id = get_user_org_role.user_id
  AND org_members.org_id = get_user_org_role.org_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(user_id uuid, org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.user_id = is_org_member.user_id
    AND org_members.org_id = is_org_member.org_id
  );
$$;

-- ============================================
-- 6. CREATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_org_branding_updated_at
  BEFORE UPDATE ON public.org_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_takeovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CREATE RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can manage all organizations" ON public.organizations FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Users can view their organizations" ON public.organizations FOR SELECT USING (public.is_org_member(auth.uid(), id));
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Org admins can update their organization" ON public.organizations FOR UPDATE USING (public.is_org_admin(auth.uid(), id));

CREATE POLICY "Super admins can manage all org members" ON public.org_members FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Users can view members of their orgs" ON public.org_members FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org admins can manage members" ON public.org_members FOR ALL USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (active = true);
CREATE POLICY "Super admins can manage plans" ON public.plans FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Org members can view their subscription" ON public.subscriptions FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org owners can manage subscription" ON public.subscriptions FOR ALL USING (public.get_user_org_role(auth.uid(), org_id) = 'owner'::public.org_role);

CREATE POLICY "Org members can view their agents" ON public.agents FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org admins can manage agents" ON public.agents FOR ALL USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Org members can view their knowledge sources" ON public.knowledge_sources FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org admins can manage knowledge sources" ON public.knowledge_sources FOR ALL USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Org members can view agent tools" ON public.agent_tools FOR SELECT USING (EXISTS (SELECT 1 FROM public.agents WHERE agents.id = agent_tools.agent_id AND public.is_org_member(auth.uid(), agents.org_id)));
CREATE POLICY "Org admins can manage agent tools" ON public.agent_tools FOR ALL USING (EXISTS (SELECT 1 FROM public.agents WHERE agents.id = agent_tools.agent_id AND public.is_org_admin(auth.uid(), agents.org_id)));

CREATE POLICY "Org members can view their conversations" ON public.conversations FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Public can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Org members can update their conversations" ON public.conversations FOR UPDATE USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Users can view messages in their org conversations" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND public.is_org_member(auth.uid(), conversations.org_id)));
CREATE POLICY "Public can create messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Org members can view their leads" ON public.leads FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org members can create leads" ON public.leads FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org admins can manage leads" ON public.leads FOR ALL USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Org members can view webhooks" ON public.webhooks FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org admins can manage webhooks" ON public.webhooks FOR ALL USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Org members can view API keys" ON public.api_keys FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org admins can manage API keys" ON public.api_keys FOR ALL USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Org members can view takeovers" ON public.conversation_takeovers FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = conversation_takeovers.conversation_id AND public.is_org_member(auth.uid(), conversations.org_id)));
CREATE POLICY "Org members can create takeovers" ON public.conversation_takeovers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = conversation_takeovers.conversation_id AND public.is_org_member(auth.uid(), conversations.org_id)));
CREATE POLICY "Takeover owner can update their takeover" ON public.conversation_takeovers FOR UPDATE USING (taken_over_by = auth.uid());

CREATE POLICY "Org members can view their branding" ON public.org_branding FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org owners can manage branding" ON public.org_branding FOR ALL USING (public.get_user_org_role(auth.uid(), org_id) = 'owner'::public.org_role);

CREATE POLICY "Org members can view their usage" ON public.usage_metrics FOR SELECT USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "System can insert usage metrics" ON public.usage_metrics FOR INSERT WITH CHECK (true);

-- ============================================
-- 9. SEED INITIAL DATA
-- ============================================

INSERT INTO public.user_roles (user_id, role, permissions)
SELECT id, 'super_admin'::public.app_role, ARRAY['manage_team', 'view_team', 'manage_projects', 'view_projects', 'manage_onboarding', 'view_onboarding', 'manage_scope_works', 'view_scope_works', 'manage_settings', 'view_settings']::public.app_permission[]
FROM auth.users
WHERE email IN ('aaron@park-web.com', 'jacob@park-web.com')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin'::public.app_role;

INSERT INTO public.plans (name, price_monthly, price_yearly, features, limits) VALUES
('Basic', 4900, 47000, '{"widget": true, "hosted_page": false, "api": false, "webhooks": false, "white_label": false}'::jsonb, '{"max_agents": 1, "max_conversations_per_month": 500, "max_messages_per_conversation": 50, "max_knowledge_sources": 5, "max_api_calls_per_month": 10000, "max_webhooks": 0}'::jsonb),
('Advanced', 14900, 143000, '{"widget": true, "hosted_page": true, "api": false, "webhooks": true, "white_label": false}'::jsonb, '{"max_agents": 5, "max_conversations_per_month": 2000, "max_messages_per_conversation": 100, "max_knowledge_sources": 25, "max_api_calls_per_month": 50000, "max_webhooks": 5}'::jsonb),
('Pro', 39900, 383000, '{"widget": true, "hosted_page": true, "api": true, "webhooks": true, "white_label": true}'::jsonb, '{"max_agents": -1, "max_conversations_per_month": 10000, "max_messages_per_conversation": 200, "max_knowledge_sources": -1, "max_api_calls_per_month": 200000, "max_webhooks": -1}'::jsonb);

DO $$
DECLARE park_web_org_id uuid; basic_plan_id uuid; aaron_user_id uuid; jacob_user_id uuid;
BEGIN
  SELECT id INTO aaron_user_id FROM auth.users WHERE email = 'aaron@park-web.com' LIMIT 1;
  SELECT id INTO jacob_user_id FROM auth.users WHERE email = 'jacob@park-web.com' LIMIT 1;
  SELECT id INTO basic_plan_id FROM public.plans WHERE name = 'Basic' LIMIT 1;
  
  INSERT INTO public.organizations (name, slug, settings) VALUES ('Park Web', 'park-web', '{"timezone": "America/New_York"}'::jsonb) RETURNING id INTO park_web_org_id;
  
  IF aaron_user_id IS NOT NULL THEN INSERT INTO public.org_members (org_id, user_id, role) VALUES (park_web_org_id, aaron_user_id, 'owner'::public.org_role); END IF;
  IF jacob_user_id IS NOT NULL THEN INSERT INTO public.org_members (org_id, user_id, role) VALUES (park_web_org_id, jacob_user_id, 'owner'::public.org_role); END IF;
  
  INSERT INTO public.subscriptions (org_id, plan_id, status, current_period_start, current_period_end) VALUES (park_web_org_id, basic_plan_id, 'active', now(), now() + interval '1 month');
END $$;

-- ============================================
-- 10. DROP OLD TABLES
-- ============================================

DROP TABLE IF EXISTS public.client_folder_assignments CASCADE;
DROP TABLE IF EXISTS public.client_folders CASCADE;
DROP TABLE IF EXISTS public.client_onboarding_links CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.draft_submissions CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.onboarding_submissions CASCADE;
DROP TABLE IF EXISTS public.onboarding_templates CASCADE;
DROP TABLE IF EXISTS public.onboarding_tokens CASCADE;
DROP TABLE IF EXISTS public.pending_invitations CASCADE;
DROP TABLE IF EXISTS public.project_tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.request_links CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.scope_of_works CASCADE;
DROP TABLE IF EXISTS public.scope_work_approvals CASCADE;
DROP TABLE IF EXISTS public.security_logs CASCADE;

DROP TYPE IF EXISTS public.request_priority CASCADE;
DROP TYPE IF EXISTS public.request_status CASCADE;