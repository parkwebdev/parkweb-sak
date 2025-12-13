-- =============================================
-- Phase 1: Living Data Sources Foundation
-- =============================================

-- Step 1: Create New Enums
-- =============================================

-- Knowledge source type enum
CREATE TYPE knowledge_source_type AS ENUM ('url', 'sitemap', 'property_listings', 'property_feed');

-- Refresh strategy enum with granular hourly options
CREATE TYPE refresh_strategy AS ENUM ('manual', 'hourly_1', 'hourly_2', 'hourly_3', 'hourly_4', 'hourly_6', 'hourly_12', 'daily');

-- Property status enum (no 'off_market' - we hard delete)
CREATE TYPE property_status AS ENUM ('available', 'pending', 'sold', 'rented', 'coming_soon');

-- Property price type enum
CREATE TYPE property_price_type AS ENUM ('sale', 'rent_monthly', 'rent_weekly');

-- Step 2: Create Locations Table (before altering knowledge_sources due to FK)
-- =============================================

CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  phone TEXT,
  email TEXT,
  business_hours JSONB DEFAULT '{}',
  url_patterns TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for locations
CREATE INDEX idx_locations_agent_id ON public.locations(agent_id);
CREATE INDEX idx_locations_user_id ON public.locations(user_id);
CREATE INDEX idx_locations_is_active ON public.locations(is_active) WHERE is_active = true;

-- Enable RLS on locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Locations RLS policies
CREATE POLICY "Users can view accessible locations"
  ON public.locations FOR SELECT
  USING (has_account_access(user_id));

CREATE POLICY "Users can create locations for accessible agents"
  ON public.locations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = locations.agent_id
    AND has_account_access(agents.user_id)
  ));

CREATE POLICY "Users can update accessible locations"
  ON public.locations FOR UPDATE
  USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible locations"
  ON public.locations FOR DELETE
  USING (has_account_access(user_id));

-- Trigger for updated_at on locations
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Step 3: Alter Knowledge Sources Table
-- =============================================

-- Add new columns for refresh functionality
ALTER TABLE public.knowledge_sources
  ADD COLUMN source_type knowledge_source_type DEFAULT 'url',
  ADD COLUMN refresh_strategy refresh_strategy DEFAULT 'manual',
  ADD COLUMN content_hash TEXT,
  ADD COLUMN last_fetched_at TIMESTAMPTZ,
  ADD COLUMN next_refresh_at TIMESTAMPTZ,
  ADD COLUMN default_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN extraction_config JSONB DEFAULT '{}';

-- Create index for efficient cron queries
CREATE INDEX idx_knowledge_sources_next_refresh 
  ON public.knowledge_sources(next_refresh_at) 
  WHERE next_refresh_at IS NOT NULL AND refresh_strategy != 'manual';

-- Step 4: Create Properties Table
-- =============================================

CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  external_id TEXT,
  address TEXT,
  lot_number TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  status property_status DEFAULT 'available',
  price INTEGER,
  price_type property_price_type DEFAULT 'rent_monthly',
  beds INTEGER,
  baths NUMERIC(3,1),
  sqft INTEGER,
  year_built INTEGER,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  images JSONB DEFAULT '[]',
  listing_url TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for properties
CREATE INDEX idx_properties_agent_status ON public.properties(agent_id, status);
CREATE INDEX idx_properties_knowledge_source ON public.properties(knowledge_source_id);
CREATE INDEX idx_properties_location ON public.properties(location_id);
CREATE INDEX idx_properties_external_id ON public.properties(knowledge_source_id, external_id);

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties RLS policies (follows knowledge_sources access)
CREATE POLICY "Users can view accessible properties"
  ON public.properties FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM knowledge_sources ks
    WHERE ks.id = properties.knowledge_source_id
    AND has_account_access(ks.user_id)
  ));

CREATE POLICY "Users can create properties for accessible sources"
  ON public.properties FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM knowledge_sources ks
    WHERE ks.id = properties.knowledge_source_id
    AND has_account_access(ks.user_id)
  ));

CREATE POLICY "Users can update accessible properties"
  ON public.properties FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM knowledge_sources ks
    WHERE ks.id = properties.knowledge_source_id
    AND has_account_access(ks.user_id)
  ));

CREATE POLICY "Users can delete accessible properties"
  ON public.properties FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM knowledge_sources ks
    WHERE ks.id = properties.knowledge_source_id
    AND has_account_access(ks.user_id)
  ));

-- Trigger for updated_at on properties
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Step 5: Alter Conversations Table
-- =============================================

ALTER TABLE public.conversations
  ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX idx_conversations_location ON public.conversations(location_id) WHERE location_id IS NOT NULL;