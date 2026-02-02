import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAutomation } from '@/hooks/useAutomation';
import { Platform, PLATFORM_CONFIGS } from '@/lib/types';
import { Send, Loader2 } from 'lucide-react';

interface PostToAllButtonProps {
  listingId: string;
  listingTitle: string;
}

export function PostToAllButton({ listingId, listingTitle }: PostToAllButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['grailed', 'vinted', 'plick']);
  const { crosspostListing } = useAutomation();

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePost = async () => {
    if (selectedPlatforms.length === 0) return;

    await crosspostListing.mutateAsync({
      listing_id: listingId,
      platforms: selectedPlatforms,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Send className="h-4 w-4" />
          Post to Platforms
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post Listing</DialogTitle>
          <DialogDescription>
            Queue "{listingTitle}" for posting to selected platforms
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {PLATFORM_CONFIGS.map((config) => (
            <div key={config.platform} className="flex items-center space-x-3">
              <Checkbox
                id={config.platform}
                checked={selectedPlatforms.includes(config.platform)}
                onCheckedChange={() => togglePlatform(config.platform)}
              />
              <Label htmlFor={config.platform} className="flex items-center gap-2 cursor-pointer">
                <span>{config.icon}</span>
                <span>{config.name}</span>
                <span className="text-xs text-muted-foreground">({config.currency})</span>
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePost}
            disabled={selectedPlatforms.length === 0 || crosspostListing.isPending}
          >
            {crosspostListing.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 && 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
