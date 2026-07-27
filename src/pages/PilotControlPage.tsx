import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureFlags, setFlagOverride } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Activity, AlertTriangle, Rocket, ShieldCheck, RefreshCw } from 'lucide-react';

interface FlagRow {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  allowed_roles: string[];
}

interface AlertRow {
  id: string;
  event_type: string;
  severity: string;
  title: string;
  details: string | null;
  occurrences: number;
  status: string;
  created_at: string;
}

interface EventRow {
  id: string;
  event_type: string;
  severity: string;
  message: string | null;
  route: string | null;
  created_at: string;
}

const severityTone: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  error: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  info: 'bg-primary/10 text-primary border-primary/30',
};

const PilotControlPage: React.FC = () => {
  const { refresh } = useFeatureFlags();
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [f, a, e] = await Promise.all([
      supabase.from('feature_flags').select('*').order('key'),
      supabase.from('monitoring_alerts').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(20),
      supabase.from('system_events').select('id, event_type, severity, message, route, created_at').order('created_at', { ascending: false }).limit(30),
    ]);
    setFlags((f.data ?? []) as unknown as FlagRow[]);
    setAlerts((a.data ?? []) as unknown as AlertRow[]);
    setEvents((e.data ?? []) as unknown as EventRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateFlag = async (flag: FlagRow, patch: Partial<FlagRow>) => {
    setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, ...patch } : f)));
    const { error } = await supabase.from('feature_flags').update(patch as never).eq('id', flag.id);
    if (error) {
      toast.error('Could not update flag', { description: error.message });
      void load();
    } else {
      toast.success(`${flag.key} updated`);
      void refresh();
    }
  };

  const resolveAlert = async (alert: AlertRow) => {
    const { error } = await supabase.from('monitoring_alerts').update({ status: 'resolved' }).eq('id', alert.id);
    if (error) return toast.error('Could not resolve alert', { description: error.message });
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  };

  const health = useMemo(() => {
    const critical = events.filter((e) => e.severity === 'critical').length;
    const errors = events.filter((e) => e.severity === 'error').length;
    return { critical, errors, ok: critical === 0 && errors === 0 };
  }, [events]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" /> Pilot Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Feature flags, gradual rollout and live production health for the Synapse pilot.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </header>

      <Card className={health.ok ? 'border-emerald-500/30' : 'border-destructive/30'}>
        <CardContent className="p-4 flex items-center gap-3">
          {health.ok ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          )}
          <div className="text-sm">
            <p className="font-medium">{health.ok ? 'All systems healthy' : 'Issues detected in recent events'}</p>
            <p className="text-muted-foreground">
              {health.critical} critical · {health.errors} errors in the last 30 recorded events
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Open alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <Skeleton className="h-16 w-full" />}
          {!loading && alerts.length === 0 && (
            <p className="text-sm text-muted-foreground">No open alerts. Auth, artifacts and loading screens are behaving.</p>
          )}
          {alerts.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={severityTone[a.severity] ?? ''}>{a.severity}</Badge>
                  <p className="font-medium text-sm truncate">{a.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.details}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => void resolveAlert(a)}>Resolve</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Feature flags &amp; rollout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <Skeleton className="h-24 w-full" />}
          {!loading && flags.length === 0 && (
            <p className="text-sm text-muted-foreground">No flags configured yet.</p>
          )}
          {flags.map((flag) => (
            <div key={flag.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{flag.key}</p>
                  {flag.description && <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>}
                  {flag.allowed_roles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {flag.allowed_roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(v) => void updateFlag(flag, { enabled: v })}
                  aria-label={`Enable ${flag.key}`}
                />
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[flag.rollout_percentage]}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!flag.enabled}
                  onValueChange={([v]) => setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, rollout_percentage: v } : f)))}
                  onValueCommit={([v]) => void updateFlag(flag, { rollout_percentage: v })}
                  aria-label={`${flag.key} rollout percentage`}
                />
                <span className="text-xs tabular-nums w-12 text-right text-muted-foreground">
                  {flag.rollout_percentage}%
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setFlagOverride(flag.key, true)}>
                  Force on (me)
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setFlagOverride(flag.key, null)}>
                  Clear override
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" /> Recent health events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <Skeleton className="h-20 w-full" />}
          {!loading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">No events recorded yet.</p>
          )}
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 text-xs border-b last:border-0 py-2">
              <div className="min-w-0">
                <span className="font-medium">{e.event_type}</span>
                {e.message && <span className="text-muted-foreground"> — {e.message}</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {e.route && <span className="text-muted-foreground hidden sm:inline">{e.route}</span>}
                <Badge variant="outline" className={severityTone[e.severity] ?? ''}>{e.severity}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PilotControlPage;
