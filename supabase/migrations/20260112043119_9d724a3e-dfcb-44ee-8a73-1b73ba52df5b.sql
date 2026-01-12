-- Platform KB Categories table
CREATE TABLE platform_kb_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE platform_kb_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "Anyone can read platform KB categories"
  ON platform_kb_categories FOR SELECT
  USING (true);

-- Super admins can manage categories
CREATE POLICY "Super admins can manage platform KB categories"
  ON platform_kb_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Seed with existing categories from knowledge-base-config.ts
INSERT INTO platform_kb_categories (id, label, color, icon_name, order_index) VALUES
  ('getting-started', 'Getting Started', 'bg-info', 'Flag01', 0),
  ('ari', 'Ari (Your AI Agent)', 'bg-accent-purple', 'Bot', 1),
  ('inbox', 'Inbox', 'bg-success', 'MessageSquare01', 2),
  ('leads', 'Leads', 'bg-warning', 'Users01', 3),
  ('planner', 'Planner', 'bg-status-active', 'Calendar', 4),
  ('analytics', 'Analytics', 'bg-destructive', 'BarChart01', 5),
  ('settings', 'Settings & Team', 'bg-muted-foreground', 'Settings01', 6);

-- Platform KB Articles table
CREATE TABLE platform_kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES platform_kb_categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL DEFAULT '',
  icon_name TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(category_id, slug)
);

-- Enable RLS
ALTER TABLE platform_kb_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Anyone can read published platform KB articles"
  ON platform_kb_articles FOR SELECT
  USING (is_published = true);

-- Super admins can manage all articles
CREATE POLICY "Super admins can manage platform KB articles"
  ON platform_kb_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_platform_kb_articles_category ON platform_kb_articles(category_id);
CREATE INDEX idx_platform_kb_articles_slug ON platform_kb_articles(category_id, slug);
CREATE INDEX idx_platform_kb_articles_published ON platform_kb_articles(is_published) WHERE is_published = true;

-- Update timestamp trigger
CREATE TRIGGER update_platform_kb_articles_updated_at
  BEFORE UPDATE ON platform_kb_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_kb_categories_updated_at
  BEFORE UPDATE ON platform_kb_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();