import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Listing, Platform, PLATFORM_CONFIGS, Condition } from '@/lib/types';
import { optimizeForPlatform } from '@/lib/platformOptimizer';

interface CopyForPlatformProps {
  listing: Listing;
}

export function CopyForPlatform({ listing }: CopyForPlatformProps) {
  const [copied, setCopied] = useState<Platform | null>(null);

  const copyForPlatform = async (platform: Platform) => {
    const optimized = optimizeForPlatform(
      platform,
      listing.title,
      listing.description || '',
      listing.brand || '',
      listing.size || '',
      (listing.condition as Condition) || 'good',
      listing.category || '',
      listing.tags || [],
      listing.base_price,
      listing.currency
    );

    const config = PLATFORM_CONFIGS.find(p => p.platform === platform)!;
    
    const text = `${optimized.title}

${optimized.description}

Price: ${optimized.price} ${optimized.currency}
${optimized.tags.length > 0 ? `Tags: ${optimized.tags.join(', ')}` : ''}`;

    await navigator.clipboard.writeText(text);
    setCopied(platform);
    toast.success(`Copied for ${config.name}!`, {
      description: 'Paste this into your listing'
    });
    
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {PLATFORM_CONFIGS.map((config) => (
          <DropdownMenuItem 
            key={config.platform}
            onClick={() => copyForPlatform(config.platform)}
            className="gap-2"
          >
            {copied === config.platform ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <span className="text-base">{config.icon}</span>
            )}
            Copy for {config.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
