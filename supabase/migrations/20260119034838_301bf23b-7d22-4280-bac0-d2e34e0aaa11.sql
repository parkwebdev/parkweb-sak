-- Update platform HC categories to use consistent semantic colors
-- These colors match the CATEGORY_COLOR_MAP used across Help Center components

UPDATE platform_hc_categories SET color = 'bg-info' WHERE id = 'getting-started';
UPDATE platform_hc_categories SET color = 'bg-accent-purple' WHERE id = 'ari';
UPDATE platform_hc_categories SET color = 'bg-warning' WHERE id = 'inbox';
UPDATE platform_hc_categories SET color = 'bg-success' WHERE id = 'leads';
UPDATE platform_hc_categories SET color = 'bg-status-active' WHERE id = 'planner';
UPDATE platform_hc_categories SET color = 'bg-destructive' WHERE id = 'analytics';
UPDATE platform_hc_categories SET color = 'bg-muted-foreground' WHERE id = 'settings';