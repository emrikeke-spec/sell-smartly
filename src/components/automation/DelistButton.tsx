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
import { MinusCircle, Loader2 } from 'lucide-react';

interface DelistButtonProps {
  listingId: string;
  listingTitle: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}

export function DelistButton({ listingId, listingTitle, variant = 'outline' }: DelistButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['grailed', 'vinted', 'plick']);
  const { queueMultipleTasks } = useAutomation();

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleDelist = async () => {
    if (selectedPlatforms.length === 0) return;

    await queueMultipleTasks.mutateAsync({
      listing_id: listingId,
      platforms: selectedPlatforms,
      action: 'delist',
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant} className="gap-2">
          <MinusCircle className="h-4 w-4" />
          Delist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delist from Platforms</DialogTitle>
          <DialogDescription>
            Queue "{listingTitle}" for removal from selected platforms
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {PLATFORM_CONFIGS.map((config) => (
            <div key={config.platform} className="flex items-center space-x-3">
              <Checkbox
                id={`delist-${config.platform}`}
                checked={selectedPlatforms.includes(config.platform)}
                onCheckedChange={() => togglePlatform(config.platform)}
              />
              <Label htmlFor={`delist-${config.platform}`} className="flex items-center gap-2 cursor-pointer">
                <span>{config.icon}</span>
                <span>{config.name}</span>
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelist}
            disabled={selectedPlatforms.length === 0 || queueMultipleTasks.isPending}
          >
            {queueMultipleTasks.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delist from {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 && 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
