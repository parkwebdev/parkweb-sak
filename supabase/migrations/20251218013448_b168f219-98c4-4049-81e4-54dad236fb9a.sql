-- Clean up orphaned soft-deleted locations (one-time cleanup)
DELETE FROM locations WHERE is_active = false;