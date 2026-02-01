import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Copy, Check, ExternalLink, DollarSign } from 'lucide-react';
import { Platform, PLATFORM_CONFIGS, Condition } from '@/lib/types';
import { optimizeForPlatform, calculatePlatformPrice } from '@/lib/platformOptimizer';

interface PlatformPreviewProps {
  title: string;
  description: string;
  brand: string;
  size: string;
  condition: Condition;
  category: string;
  tags: string[];
  basePrice: number;
  baseCurrency: string;
}

export function PlatformPreview({
  title,
  description,
  brand,
  size,
  condition,
  category,
  tags,
  basePrice,
  baseCurrency,
}: PlatformPreviewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderPlatformContent = (platform: Platform) => {
    const config = PLATFORM_CONFIGS.find((p) => p.platform === platform)!;
    const optimized = optimizeForPlatform(
      platform,
      title,
      description,
      brand,
      size,
      condition,
      category,
      tags,
      basePrice,
      baseCurrency
    );
    const priceInfo = calculatePlatformPrice(basePrice, baseCurrency, platform);

    return (
      <div className="space-y-4">
        {/* Price Overview */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">List Price</p>
                <p className="text-2xl font-bold">
                  {optimized.currency === 'USD' && '$'}
                  {optimized.currency === 'EUR' && '€'}
                  {optimized.currency === 'SEK' && ''}
                  {optimized.price}
                  {optimized.currency === 'SEK' && ' kr'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  You'll earn (after {config.feePercentage}% fee)
                </p>
                <p className="text-xl font-semibold text-primary">
                  {optimized.currency === 'USD' && '$'}
                  {optimized.currency === 'EUR' && '€'}
                  {optimized.currency === 'SEK' && ''}
                  {priceInfo.netEarnings}
                  {optimized.currency === 'SEK' && ' kr'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Title</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(optimized.title, `${platform}-title`)}
            >
              {copiedField === `${platform}-title` ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              Copy
            </Button>
          </div>
          <Input value={optimized.title} readOnly className="bg-muted" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Description</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(optimized.description, `${platform}-desc`)
              }
            >
              {copiedField === `${platform}-desc` ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              Copy
            </Button>
          </div>
          <Textarea
            value={optimized.description}
            readOnly
            className="bg-muted min-h-[150px]"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Tags</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(optimized.tags.join(', '), `${platform}-tags`)
              }
            >
              {copiedField === `${platform}-tags` ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              Copy All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {optimized.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full" variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Open {config.name} to Post
        </Button>
      </div>
    );
  };

  if (!title || !basePrice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Previews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Fill in the listing details to see platform-optimized versions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Platform-Optimized Listings</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grailed">
          <TabsList className="grid grid-cols-3 w-full">
            {PLATFORM_CONFIGS.map((config) => (
              <TabsTrigger key={config.platform} value={config.platform}>
                <span className="mr-1">{config.icon}</span>
                {config.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {PLATFORM_CONFIGS.map((config) => (
            <TabsContent key={config.platform} value={config.platform}>
              {renderPlatformContent(config.platform)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
