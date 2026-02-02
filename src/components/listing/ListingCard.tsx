import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, CheckCircle, Send } from 'lucide-react';
import { Listing, PlatformListing, PLATFORM_CONFIGS } from '@/lib/types';
import { Link } from 'react-router-dom';
import { PostToAllButton } from '@/components/automation/PostToAllButton';
import { DelistButton } from '@/components/automation/DelistButton';

interface ListingCardProps {
  listing: Listing;
  platformListings?: PlatformListing[];
  onMarkSold?: (listingId: string) => void;
  onDelete?: (listingId: string) => void;
}

export function ListingCard({
  listing,
  platformListings = [],
  onMarkSold,
  onDelete,
}: ListingCardProps) {
  const coverPhoto = listing.photos?.[0] || '/placeholder.svg';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'listed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'sold':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'ready':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={coverPhoto}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className={`${getStatusColor(listing.status)} backdrop-blur-sm`}
          >
            {listing.status}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{listing.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {listing.brand} • Size {listing.size}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/listing/${listing.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMarkSold?.(listing.id)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Sold
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(listing.id)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-lg font-bold mt-2">
          ${listing.base_price} {listing.currency}
        </p>

        {/* Platform Status Indicators */}
        <div className="flex items-center gap-1 mt-3">
          {PLATFORM_CONFIGS.map((config) => {
            const platformListing = platformListings.find(
              (pl) => pl.platform === config.platform
            );
            return (
              <div
                key={config.platform}
                className={`flex items-center justify-center w-8 h-8 rounded text-sm ${
                  platformListing?.status === 'listed'
                    ? 'bg-green-500/10 text-green-600'
                    : platformListing?.status === 'sold'
                    ? 'bg-blue-500/10 text-blue-600'
                    : platformListing?.status === 'ready'
                    ? 'bg-orange-500/10 text-orange-600'
                    : 'bg-muted text-muted-foreground'
                }`}
                title={`${config.name}: ${platformListing?.status || 'Not listed'}`}
              >
                {config.icon}
              </div>
            );
          })}
        </div>

        {/* Automation Actions */}
        {listing.status !== 'sold' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <PostToAllButton listingId={listing.id} listingTitle={listing.title} />
            <DelistButton listingId={listing.id} listingTitle={listing.title} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
