export type Platform = 'grailed' | 'vinted' | 'plick';

export type ListingStatus = 'draft' | 'active' | 'sold' | 'archived';

export type PlatformStatus = 'draft' | 'ready' | 'listed' | 'sold' | 'removed';

export type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export type AutomationAction = 'post' | 'update' | 'delist' | 'mark_sold';

export type AutomationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface AutomationTask {
  id: string;
  user_id: string;
  listing_id: string | null;
  platform: Platform;
  action: AutomationAction;
  status: AutomationStatus;
  payload: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  brand: string | null;
  size: string | null;
  condition: Condition;
  category: string | null;
  tags: string[] | null;
  base_price: number;
  currency: string;
  photos: string[] | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface PlatformListing {
  id: string;
  listing_id: string;
  platform: Platform;
  status: PlatformStatus;
  platform_price: number | null;
  platform_currency: string | null;
  optimized_title: string | null;
  optimized_description: string | null;
  platform_url: string | null;
  listed_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  default_currency: string;
  grailed_username: string | null;
  vinted_username: string | null;
  plick_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  brand: string;
  size: string;
  condition: Condition;
  category: string;
  tags: string[];
  basePrice: number;
  currency: string;
  photos: File[];
}

export interface PlatformConfig {
  name: string;
  platform: Platform;
  icon: string;
  feePercentage: number;
  currency: string;
  enabled: boolean;
}

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    name: 'Grailed',
    platform: 'grailed',
    icon: '🏷️',
    feePercentage: 9,
    currency: 'USD',
    enabled: true,
  },
  {
    name: 'Vinted',
    platform: 'vinted',
    icon: '👗',
    feePercentage: 5,
    currency: 'EUR',
    enabled: true,
  },
  {
    name: 'Plick',
    platform: 'plick',
    icon: '🇸🇪',
    feePercentage: 10,
    currency: 'SEK',
    enabled: true,
  },
];

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'new', label: 'New with tags' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Outerwear',
  'Footwear',
  'Accessories',
  'Bags',
  'Jewelry',
  'Watches',
];
