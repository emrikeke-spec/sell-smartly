-- Create table for storing encrypted platform credentials
CREATE TABLE public.platform_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  username TEXT,
  email TEXT,
  encrypted_password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access their own credentials
CREATE POLICY "Users can view their own credentials"
ON public.platform_credentials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
ON public.platform_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
ON public.platform_credentials
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
ON public.platform_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_platform_credentials_updated_at
BEFORE UPDATE ON public.platform_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();