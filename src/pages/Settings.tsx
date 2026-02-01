import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [grailedUsername, setGrailedUsername] = useState('');
  const [vintedUsername, setVintedUsername] = useState('');
  const [plickUsername, setPlickUsername] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || '');
      setDefaultCurrency(data.default_currency || 'USD');
      setGrailedUsername(data.grailed_username || '');
      setVintedUsername(data.vinted_username || '');
      setPlickUsername(data.plick_username || '');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: displayName,
      default_currency: defaultCurrency,
      grailed_username: grailedUsername,
      vinted_username: vintedUsername,
      plick_username: plickUsername,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
      });
    }

    setIsLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Default settings for new listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="SEK">SEK (kr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Accounts</CardTitle>
            <CardDescription>
              Link your platform usernames for quick access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grailed">Grailed Username</Label>
              <Input
                id="grailed"
                placeholder="@username"
                value={grailedUsername}
                onChange={(e) => setGrailedUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vinted">Vinted Username</Label>
              <Input
                id="vinted"
                placeholder="@username"
                value={vintedUsername}
                onChange={(e) => setVintedUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plick">Plick Username</Label>
              <Input
                id="plick"
                placeholder="@username"
                value={plickUsername}
                onChange={(e) => setPlickUsername(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </DashboardLayout>
  );
}
