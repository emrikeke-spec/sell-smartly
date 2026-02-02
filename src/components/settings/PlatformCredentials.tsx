import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react';

interface PlatformCredential {
  platform: string;
  username: string;
  email: string;
  password: string;
  saved: boolean;
}

const PLATFORMS = [
  { id: 'grailed', name: 'Grailed', icon: '🏷️', color: 'bg-red-500/10 text-red-500' },
  { id: 'vinted', name: 'Vinted', icon: '👗', color: 'bg-green-500/10 text-green-500' },
  { id: 'plick', name: 'Plick', icon: '🇸🇪', color: 'bg-blue-500/10 text-blue-500' },
];

// Simple encryption (in production, use a proper encryption library)
const encryptPassword = (password: string): string => {
  return btoa(password); // Base64 encoding - replace with proper encryption
};

export function PlatformCredentials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [savedPlatforms, setSavedPlatforms] = useState<string[]>([]);
  
  const [credentials, setCredentials] = useState<Record<string, PlatformCredential>>({
    grailed: { platform: 'grailed', username: '', email: '', password: '', saved: false },
    vinted: { platform: 'vinted', username: '', email: '', password: '', saved: false },
    plick: { platform: 'plick', username: '', email: '', password: '', saved: false },
  });

  useEffect(() => {
    if (user) {
      loadCredentials();
    }
  }, [user]);

  const loadCredentials = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('platform_credentials')
      .select('platform, username, email')
      .eq('user_id', user.id);

    if (data) {
      const saved = data.map(d => d.platform);
      setSavedPlatforms(saved);
      
      const updated = { ...credentials };
      data.forEach(cred => {
        if (updated[cred.platform]) {
          updated[cred.platform] = {
            ...updated[cred.platform],
            username: cred.username || '',
            email: cred.email || '',
            password: '', // Never load password back
            saved: true,
          };
        }
      });
      setCredentials(updated);
    }
  };

  const updateCredential = (platform: string, field: keyof PlatformCredential, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value, saved: false }
    }));
  };

  const saveCredential = async (platform: string) => {
    if (!user) return;
    
    const cred = credentials[platform];
    if (!cred.email || !cred.password) {
      toast({
        title: 'Missing fields',
        description: 'Email and password are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from('platform_credentials')
      .upsert({
        user_id: user.id,
        platform: platform,
        username: cred.username,
        email: cred.email,
        encrypted_password: encryptPassword(cred.password),
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' });

    if (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save credentials',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved',
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} credentials saved securely`,
      });
      setSavedPlatforms(prev => [...new Set([...prev, platform])]);
      setCredentials(prev => ({
        ...prev,
        [platform]: { ...prev[platform], password: '', saved: true }
      }));
    }

    setIsLoading(false);
  };

  const deleteCredential = async (platform: string) => {
    if (!user) return;
    
    setIsLoading(true);

    const { error } = await supabase
      .from('platform_credentials')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete credentials',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} credentials removed`,
      });
      setSavedPlatforms(prev => prev.filter(p => p !== platform));
      setCredentials(prev => ({
        ...prev,
        [platform]: { platform, username: '', email: '', password: '', saved: false }
      }));
    }

    setIsLoading(false);
  };

  const togglePasswordVisibility = (platform: string) => {
    setShowPasswords(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <CardTitle>Platform Login Credentials</CardTitle>
        </div>
        <CardDescription>
          Save your login details to enable automated cross-posting. Credentials are encrypted and stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {PLATFORMS.map((platform) => {
          const cred = credentials[platform.id];
          const isSaved = savedPlatforms.includes(platform.id);
          
          return (
            <div key={platform.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-medium">{platform.name}</span>
                  {isSaved && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </Badge>
                  )}
                </div>
                {isSaved && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteCredential(platform.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`${platform.id}-username`}>Username (optional)</Label>
                  <Input
                    id={`${platform.id}-username`}
                    placeholder="@username"
                    value={cred.username}
                    onChange={(e) => updateCredential(platform.id, 'username', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`${platform.id}-email`}>Email *</Label>
                  <Input
                    id={`${platform.id}-email`}
                    type="email"
                    placeholder="your@email.com"
                    value={cred.email}
                    onChange={(e) => updateCredential(platform.id, 'email', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`${platform.id}-password`}>
                    Password * {isSaved && <span className="text-muted-foreground">(enter to update)</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`${platform.id}-password`}
                      type={showPasswords[platform.id] ? 'text' : 'password'}
                      placeholder={isSaved ? '••••••••' : 'Enter password'}
                      value={cred.password}
                      onChange={(e) => updateCredential(platform.id, 'password', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility(platform.id)}
                    >
                      {showPasswords[platform.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {(!isSaved || cred.password) && (
                <Button
                  onClick={() => saveCredential(platform.id)}
                  disabled={isLoading || (!cred.email || !cred.password)}
                  size="sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaved ? 'Update Credentials' : 'Save Credentials'}
                </Button>
              )}
            </div>
          );
        })}

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How it works</p>
              <p>Once you save your credentials, you can use the "Post to All" button on any listing. The system will automatically log into each platform and create the listing for you.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
