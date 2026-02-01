import { Platform, Condition, PLATFORM_CONFIGS } from './types';

// Exchange rates (in real app, fetch from API)
const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  SEK: 10.5,
};

interface OptimizedContent {
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
}

const conditionMap: Record<Platform, Record<Condition, string>> = {
  grailed: {
    new: 'New/Never Worn',
    like_new: 'Gently Used',
    good: 'Used',
    fair: 'Very Worn',
    poor: 'Not Specified',
  },
  vinted: {
    new: 'New with tags',
    like_new: 'New without tags',
    good: 'Very good',
    fair: 'Good',
    poor: 'Satisfactory',
  },
  plick: {
    new: 'Nytt med lappar',
    like_new: 'Nyskick',
    good: 'Bra skick',
    fair: 'Okej skick',
    poor: 'Slitet',
  },
};

export function convertPrice(
  basePrice: number,
  baseCurrency: string,
  targetCurrency: string
): number {
  const baseRate = EXCHANGE_RATES[baseCurrency as keyof typeof EXCHANGE_RATES] || 1;
  const targetRate = EXCHANGE_RATES[targetCurrency as keyof typeof EXCHANGE_RATES] || 1;
  
  const usdPrice = basePrice / baseRate;
  const convertedPrice = usdPrice * targetRate;
  
  return Math.round(convertedPrice);
}

export function calculatePlatformPrice(
  basePrice: number,
  baseCurrency: string,
  platform: Platform
): { price: number; currency: string; netEarnings: number } {
  const config = PLATFORM_CONFIGS.find(p => p.platform === platform)!;
  const convertedPrice = convertPrice(basePrice, baseCurrency, config.currency);
  const feeAmount = convertedPrice * (config.feePercentage / 100);
  const netEarnings = convertedPrice - feeAmount;
  
  return {
    price: convertedPrice,
    currency: config.currency,
    netEarnings: Math.round(netEarnings),
  };
}

export function optimizeForGrailed(
  title: string,
  description: string,
  brand: string,
  size: string,
  condition: Condition,
  category: string,
  tags: string[]
): OptimizedContent {
  // Grailed: Focus on brand, designer tags, streetwear terminology
  const optimizedTitle = `${brand} ${title}`.slice(0, 60);
  
  const conditionText = conditionMap.grailed[condition];
  
  const optimizedDescription = `${description}

Condition: ${conditionText}
Size: ${size}
Brand: ${brand}

Ships fast. Open to offers.`;

  const grailedTags = [
    brand.toLowerCase(),
    category.toLowerCase(),
    ...tags,
    'streetwear',
    'designer',
    'vintage',
  ].filter(Boolean).slice(0, 10);

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    price: 0,
    currency: 'USD',
    tags: grailedTags,
  };
}

export function optimizeForVinted(
  title: string,
  description: string,
  brand: string,
  size: string,
  condition: Condition,
  category: string,
  tags: string[]
): OptimizedContent {
  // Vinted: EU-friendly, metric sizing, shipping focused
  const optimizedTitle = `${brand} ${title}`.slice(0, 50);
  
  const conditionText = conditionMap.vinted[condition];
  
  const optimizedDescription = `${description}

📏 Size: ${size}
🏷️ Brand: ${brand}
✨ Condition: ${conditionText}

Fast shipping! Feel free to make an offer or bundle for discount.`;

  const vintedTags = [
    brand.toLowerCase(),
    category.toLowerCase(),
    ...tags,
  ].filter(Boolean).slice(0, 5);

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    price: 0,
    currency: 'EUR',
    tags: vintedTags,
  };
}

export function optimizeForPlick(
  title: string,
  description: string,
  brand: string,
  size: string,
  condition: Condition,
  category: string,
  tags: string[]
): OptimizedContent {
  // Plick: Swedish market, SEK pricing
  const optimizedTitle = `${brand} ${title}`.slice(0, 50);
  
  const conditionText = conditionMap.plick[condition];
  
  const optimizedDescription = `${description}

Storlek: ${size}
Märke: ${brand}
Skick: ${conditionText}

Snabb leverans! Skicka meddelande för frågor.`;

  const plickTags = [
    brand.toLowerCase(),
    category.toLowerCase(),
    ...tags,
  ].filter(Boolean).slice(0, 5);

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    price: 0,
    currency: 'SEK',
    tags: plickTags,
  };
}

export function optimizeForPlatform(
  platform: Platform,
  title: string,
  description: string,
  brand: string,
  size: string,
  condition: Condition,
  category: string,
  tags: string[],
  basePrice: number,
  baseCurrency: string
): OptimizedContent {
  let content: OptimizedContent;
  
  switch (platform) {
    case 'grailed':
      content = optimizeForGrailed(title, description, brand, size, condition, category, tags);
      break;
    case 'vinted':
      content = optimizeForVinted(title, description, brand, size, condition, category, tags);
      break;
    case 'plick':
      content = optimizeForPlick(title, description, brand, size, condition, category, tags);
      break;
  }
  
  const { price, currency } = calculatePlatformPrice(basePrice, baseCurrency, platform);
  
  return {
    ...content,
    price,
    currency,
  };
}
