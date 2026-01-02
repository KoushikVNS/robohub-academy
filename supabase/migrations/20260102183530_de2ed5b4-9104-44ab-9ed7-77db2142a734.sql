-- Add mobile_number column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number text;

-- Create unique index on mobile_number for login lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_mobile_number_unique ON public.profiles(mobile_number) WHERE mobile_number IS NOT NULL;