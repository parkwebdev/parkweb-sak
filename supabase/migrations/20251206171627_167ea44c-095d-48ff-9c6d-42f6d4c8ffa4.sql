-- Add sound_notifications column to notification_preferences table
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS sound_notifications boolean DEFAULT true;