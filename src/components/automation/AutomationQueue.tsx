import { useAutomation } from '@/hooks/useAutomation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AutomationStatus, Platform } from '@/lib/types';

const platformLabels: Record<Platform, string> = {
  grailed: 'Grailed',
  vinted: 'Vinted',
  plick: 'Plick',
};

const statusConfig: Record<AutomationStatus, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
  in_progress: { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'bg-primary/20 text-primary' },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-500/20 text-green-700' },
  failed: { icon: <XCircle className="h-4 w-4" />, color: 'bg-destructive/20 text-destructive' },
};

export function AutomationQueue() {
  const { tasks, isLoading, cancelTask } = useAutomation();

  const recentTasks = tasks.slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Automation Queue</CardTitle>
        <CardDescription>
          Tasks waiting for the desktop companion app
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No automation tasks yet
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {recentTasks.map((task) => {
                const config = statusConfig[task.status as AutomationStatus];
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={config.color}>
                        {config.icon}
                        <span className="ml-1 capitalize">{task.status}</span>
                      </Badge>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {task.action} → {platformLabels[task.platform as Platform]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {task.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancelTask.mutate(task.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status === 'failed' && task.error_message && (
                      <span className="text-xs text-destructive max-w-[150px] truncate">
                        {task.error_message}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
