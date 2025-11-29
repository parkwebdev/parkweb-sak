-- Create custom_domains table for better domain management
CREATE TABLE IF NOT EXISTS custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,
  verified boolean DEFAULT false,
  ssl_status text DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  verification_token text NOT NULL,
  dns_configured boolean DEFAULT false,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone,
  UNIQUE(domain),
  UNIQUE(org_id, domain)
);

-- Enable RLS
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view their custom domains"
  ON custom_domains FOR SELECT
  USING (is_org_member(auth.uid(), org_id));

CREATE POLICY "Org admins can manage custom domains"
  ON custom_domains FOR ALL
  USING (is_org_admin(auth.uid(), org_id));

-- Update trigger
CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index for faster lookups
CREATE INDEX idx_custom_domains_org_id ON custom_domains(org_id);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_verified ON custom_domains(verified);

-- Function to ensure only one primary domain per org
CREATE OR REPLACE FUNCTION ensure_single_primary_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary domains for this org
    UPDATE custom_domains
    SET is_primary = false
    WHERE org_id = NEW.org_id
    AND id != NEW.id
    AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ensure_single_primary_domain
  BEFORE INSERT OR UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_domain();

COMMENT ON TABLE custom_domains IS 'Stores custom domains for organization hosted chat pages with DNS verification and SSL status';
COMMENT ON COLUMN custom_domains.verification_token IS 'Token used for TXT record verification';
COMMENT ON COLUMN custom_domains.is_primary IS 'Whether this is the primary domain for the organization';
COMMENT ON COLUMN custom_domains.dns_configured IS 'Whether DNS records are properly configured';