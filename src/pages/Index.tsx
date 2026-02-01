import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ListingCard } from '@/components/listing/ListingCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useListings } from '@/hooks/useListings';
import { PLATFORM_CONFIGS } from '@/lib/types';
import { Plus, Package, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { listings, platformListings, isLoading, deleteListing, markAsSold } = useListings();

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === 'active' || l.status === 'draft').length,
    sold: listings.filter((l) => l.status === 'sold').length,
    totalValue: listings
      .filter((l) => l.status !== 'sold')
      .reduce((sum, l) => sum + l.base_price, 0),
  };

  const recentListings = listings.slice(0, 4);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      deleteListing.mutate(id);
    }
  };

  const handleMarkSold = (id: string) => {
    markAsSold.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your listings across all platforms
            </p>
          </div>
          <Button asChild>
            <Link to="/new-listing">
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sold</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sold}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toFixed(0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Status */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {PLATFORM_CONFIGS.map((config) => {
                const platformStats = platformListings.filter(
                  (pl) => pl.platform === config.platform
                );
                const listed = platformStats.filter((pl) => pl.status === 'listed').length;
                const sold = platformStats.filter((pl) => pl.status === 'sold').length;

                return (
                  <div
                    key={config.platform}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="text-3xl">{config.icon}</div>
                    <div>
                      <p className="font-semibold">{config.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {listed} listed • {sold} sold
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Listings</h2>
            <Button variant="ghost" asChild>
              <Link to="/inventory">View All</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : recentListings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No listings yet</p>
                <Button asChild>
                  <Link to="/new-listing">Create your first listing</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  platformListings={platformListings.filter(
                    (pl) => pl.listing_id === listing.id
                  )}
                  onMarkSold={handleMarkSold}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
