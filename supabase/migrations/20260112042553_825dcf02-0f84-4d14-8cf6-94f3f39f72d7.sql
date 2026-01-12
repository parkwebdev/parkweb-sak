-- Add pilot_support to the app_role enum type
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pilot_support';