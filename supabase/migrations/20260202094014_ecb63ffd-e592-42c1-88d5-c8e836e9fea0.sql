-- Add unique constraint for upsert on platform_listings
ALTER TABLE public.platform_listings 
ADD CONSTRAINT platform_listings_listing_platform_unique UNIQUE (listing_id, platform);