-- Create draft submissions table for save & continue later
CREATE TABLE IF NOT EXISTS draft_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  draft_data JSONB NOT NULL DEFAULT '{}',
  resume_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE draft_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for drafts
CREATE POLICY "Users can view their own drafts" 
ON draft_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts" 
ON draft_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" 
ON draft_submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view non-expired drafts by token" 
ON draft_submissions 
FOR SELECT 
USING (expires_at > now());

-- Create onboarding templates table
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  form_fields JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates (public read, admin write)
CREATE POLICY "Everyone can view active templates" 
ON onboarding_templates 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage templates" 
ON onboarding_templates 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert industry-specific templates
INSERT INTO onboarding_templates (name, industry, description, form_fields) VALUES
('RV Park Standard', 'rv-parks', 'Comprehensive onboarding for RV parks and campgrounds', '{
  "sections": [
    {
      "title": "Property Information",
      "fields": [
        {"name": "property_size", "type": "number", "label": "Property Size (acres)", "required": true},
        {"name": "site_count", "type": "number", "label": "Number of RV Sites", "required": true},
        {"name": "amenities", "type": "multiselect", "label": "Available Amenities", "options": ["Pool", "WiFi", "Laundry", "Store", "Recreation Hall", "Playground"]},
        {"name": "seasonal", "type": "select", "label": "Seasonal Operation", "options": ["Year-round", "Seasonal", "Summer only"], "required": true}
      ]
    },
    {
      "title": "Services & Features",
      "fields": [
        {"name": "reservation_system", "type": "boolean", "label": "Need online reservation system"},
        {"name": "payment_processing", "type": "boolean", "label": "Need payment processing"},
        {"name": "site_maps", "type": "boolean", "label": "Interactive site maps required"}
      ]
    }
  ]
}'),

('Healthcare Practice', 'healthcare', 'Specialized template for medical practices', '{
  "sections": [
    {
      "title": "Practice Information", 
      "fields": [
        {"name": "practice_type", "type": "select", "label": "Practice Type", "options": ["General Practice", "Dental", "Veterinary", "Specialty"], "required": true},
        {"name": "patient_volume", "type": "select", "label": "Monthly Patient Volume", "options": ["<100", "100-500", "500-1000", ">1000"], "required": true},
        {"name": "staff_count", "type": "number", "label": "Number of Staff", "required": true}
      ]
    },
    {
      "title": "Digital Needs",
      "fields": [
        {"name": "online_booking", "type": "boolean", "label": "Online appointment booking"},
        {"name": "patient_portal", "type": "boolean", "label": "Patient portal required"},
        {"name": "telemedicine", "type": "boolean", "label": "Telemedicine capabilities"},
        {"name": "hipaa_compliance", "type": "boolean", "label": "HIPAA compliance required", "required": true}
      ]
    }
  ]
}'),

('E-commerce Business', 'e-commerce', 'Template for online retail businesses', '{
  "sections": [
    {
      "title": "Business Details",
      "fields": [
        {"name": "product_count", "type": "select", "label": "Number of Products", "options": ["1-50", "51-200", "201-1000", ">1000"], "required": true},
        {"name": "business_model", "type": "select", "label": "Business Model", "options": ["B2C", "B2B", "Both"], "required": true},
        {"name": "current_platform", "type": "select", "label": "Current Platform", "options": ["None", "Shopify", "WooCommerce", "Custom", "Other"]}
      ]
    },
    {
      "title": "E-commerce Features",
      "fields": [
        {"name": "inventory_management", "type": "boolean", "label": "Inventory management system"},
        {"name": "multiple_payment", "type": "boolean", "label": "Multiple payment gateways"},
        {"name": "shipping_integration", "type": "boolean", "label": "Shipping carrier integration"},
        {"name": "multi_currency", "type": "boolean", "label": "Multi-currency support"}
      ]
    }
  ]
}'),

('Restaurant & Food Service', 'restaurant', 'Template for restaurants and food services', '{
  "sections": [
    {
      "title": "Restaurant Information",
      "fields": [
        {"name": "service_type", "type": "multiselect", "label": "Service Types", "options": ["Dine-in", "Takeout", "Delivery", "Catering"], "required": true},
        {"name": "cuisine_type", "type": "text", "label": "Cuisine Type", "required": true},
        {"name": "location_count", "type": "number", "label": "Number of Locations", "required": true}
      ]
    },
    {
      "title": "Digital Features",
      "fields": [
        {"name": "online_ordering", "type": "boolean", "label": "Online ordering system"},
        {"name": "table_reservations", "type": "boolean", "label": "Table reservation system"},
        {"name": "menu_management", "type": "boolean", "label": "Online menu management"},
        {"name": "loyalty_program", "type": "boolean", "label": "Customer loyalty program"}
      ]
    }
  ]
}')

ON CONFLICT (name) DO NOTHING;

-- Add trigger for updated_at on templates
CREATE TRIGGER update_onboarding_templates_updated_at
  BEFORE UPDATE ON onboarding_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for updated_at on drafts  
CREATE TRIGGER update_draft_submissions_updated_at
  BEFORE UPDATE ON draft_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create edge function for sending continue links
CREATE OR REPLACE FUNCTION notify_draft_save()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send notification for new drafts (not updates)
  IF TG_OP = 'INSERT' THEN
    -- Create notification for the user
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'onboarding',
      'Draft Saved: ' || NEW.client_name,
      'Onboarding draft saved for ' || NEW.client_name || '. Client can continue at any time.',
      jsonb_build_object(
        'draft_id', NEW.id,
        'client_name', NEW.client_name,
        'client_email', NEW.client_email,
        'resume_token', NEW.resume_token,
        'expires_at', NEW.expires_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for draft notifications
CREATE TRIGGER draft_save_notification_trigger
  AFTER INSERT ON draft_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_draft_save();

-- Add additional performance indexes
CREATE INDEX IF NOT EXISTS idx_client_onboarding_links_user_status 
ON client_onboarding_links(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_submissions_token 
ON draft_submissions(resume_token) WHERE expires_at > now();

CREATE INDEX IF NOT EXISTS idx_draft_submissions_user_email 
ON draft_submissions(user_id, client_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_templates_industry 
ON onboarding_templates(industry, active) WHERE active = true;