-- Create table to store OTPs
CREATE TABLE public.auth_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;

-- Allow insert from edge functions (service role)
CREATE POLICY "Service role can manage OTPs" 
ON public.auth_otps 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_auth_otps_email ON public.auth_otps(email);
CREATE INDEX idx_auth_otps_expires_at ON public.auth_otps(expires_at);