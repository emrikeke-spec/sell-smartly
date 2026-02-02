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
import { AutomationQueue } from '@/components/automation/AutomationQueue';
import { PlatformCredentials } from '@/components/settings/PlatformCredentials';
import { Loader2, Download, Copy, Check, ExternalLink } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [grailedUsername, setGrailedUsername] = useState('');
  const [vintedUsername, setVintedUsername] = useState('');
  const [plickUsername, setPlickUsername] = useState('');

  // Companion app config values
  const supabaseUrl = 'https://jmzzuqtwjzjamsjssjtd.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imptenp1cXR3anpqYW1zanNzanRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg4MTIsImV4cCI6MjA4NTU1NDgxMn0.D8AC5VNUxIzkVxS0DvlFtg_s0ro2HfnEpxCwe2wn2CM';
  const userId = user?.id || '';

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

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: 'Copied!',
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle>Desktop Companion Setup</CardTitle>
            </div>
            <CardDescription>
              Run the desktop companion app on Windows to automate posting to Grailed, Vinted, and Plick.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Step 1: Download & Install</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Install <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Node.js 18+</a></li>
                <li>Download the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">desktop-companion</code> folder from your project</li>
                <li>Open a terminal in that folder and run: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm install</code></li>
                <li>Start the app: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm start</code></li>
              </ol>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Step 2: Configure the Companion App</h4>
              <p className="text-sm text-muted-foreground">Copy these values into the companion app's Settings tab:</p>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Supabase URL</Label>
                  <div className="flex gap-2">
                    <Input value={supabaseUrl} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(supabaseUrl, 'Supabase URL')}
                    >
                      {copiedField === 'Supabase URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Supabase Anon Key</Label>
                  <div className="flex gap-2">
                    <Input value={supabaseAnonKey} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(supabaseAnonKey, 'Anon Key')}
                    >
                      {copiedField === 'Anon Key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Your User ID</Label>
                  <div className="flex gap-2">
                    <Input value={userId} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(userId, 'User ID')}
                      disabled={!userId}
                    >
                      {copiedField === 'User ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Chrome Path (Windows)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value="C:\Program Files\Google\Chrome\Application\chrome.exe" 
                      readOnly 
                      className="font-mono text-xs" 
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'Chrome Path')}
                    >
                      {copiedField === 'Chrome Path' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Step 3: Log In to Platforms</h4>
              <p className="text-sm text-muted-foreground">
                In the companion app, go to the <strong>Platforms</strong> tab and click <strong>Login</strong> for each platform.
                Complete any CAPTCHAs or 2FA challenges in the browser window that opens.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>How it works:</strong> Click "Post to All" on a listing in this web app → 
                Task is queued → Desktop companion picks it up → Puppeteer fills in the forms automatically
              </p>
            </div>
          </CardContent>
        </Card>

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

        <PlatformCredentials />

        <AutomationQueue />

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </DashboardLayout>
  );
}
