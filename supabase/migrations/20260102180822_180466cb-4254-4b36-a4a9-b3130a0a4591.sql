-- Add xp_points column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN xp_points integer NOT NULL DEFAULT 0;

-- Create index for faster filtering
CREATE INDEX idx_profiles_xp_points ON public.profiles(xp_points);
CREATE INDEX idx_profiles_enrollment_id ON public.profiles(enrollment_id);