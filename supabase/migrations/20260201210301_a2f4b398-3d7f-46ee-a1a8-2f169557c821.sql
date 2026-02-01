-- Create listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  size TEXT,
  condition TEXT NOT NULL DEFAULT 'good',
  category TEXT,
  tags TEXT[],
  base_price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  photos TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_listings table to track status per platform
CREATE TABLE public.platform_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('grailed', 'vinted', 'plick')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'listed', 'sold', 'removed')),
  platform_price DECIMAL(10,2),
  platform_currency TEXT,
  optimized_title TEXT,
  optimized_description TEXT,
  platform_url TEXT,
  listed_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, platform)
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  default_currency TEXT DEFAULT 'USD',
  grailed_username TEXT,
  vinted_username TEXT,
  plick_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for listings
CREATE POLICY "Users can view their own listings" ON public.listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for platform_listings (via listing ownership)
CREATE POLICY "Users can view their platform listings" ON public.platform_listings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.listings WHERE listings.id = platform_listings.listing_id AND listings.user_id = auth.uid())
);
CREATE POLICY "Users can create platform listings" ON public.platform_listings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.listings WHERE listings.id = platform_listings.listing_id AND listings.user_id = auth.uid())
);
CREATE POLICY "Users can update their platform listings" ON public.platform_listings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.listings WHERE listings.id = platform_listings.listing_id AND listings.user_id = auth.uid())
);
CREATE POLICY "Users can delete their platform listings" ON public.platform_listings FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.listings WHERE listings.id = platform_listings.listing_id AND listings.user_id = auth.uid())
);

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_listings_updated_at BEFORE UPDATE ON public.platform_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for listing photos
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-photos', 'listing-photos', true);

-- Storage policies for listing photos
CREATE POLICY "Anyone can view listing photos" ON storage.objects FOR SELECT USING (bucket_id = 'listing-photos');
CREATE POLICY "Authenticated users can upload listing photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own photos" ON storage.objects FOR UPDATE USING (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');