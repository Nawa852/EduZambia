import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { EmptyState } from '@/components/UI/EmptyState';
import { uploadToRepository, listRepository, type RepositoryItem } from '@/lib/resourceRepository';
import {
  ShieldCheck, Users, BookOpen, Timer, AlertTriangle, Upload, RefreshCw, Loader2, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface Row { id: string; full_name: string | null; role: string | null; school: string | null; created_at: string }
interface Alert { id: string; title?: string | null; message?: string | null; severity?: string | null; created_at: string }

const AdminConsolePage: React.FC = () => {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Row[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [quizzes, setQuizzes] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [lessons, setLessons] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [materials, setMaterials] = useState<RepositoryItem[]>([]);
  const [subject, setSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: profiles }, { count: quizCount }, { data: focus }, { count: lessonCount }, { data: alertRows }] =
        await Promise.all([
          supabase.from('profiles').select('id, full_name, role, school, created_at').order('created_at', { ascending: false }).limit(200),
          supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }),
          supabase.from('focus_sessions').select('focus_minutes').limit(2000),
          supabase.from('lesson_completions').select('id', { count: 'exact', head: true }),
          supabase.from('monitoring_alerts').select('*').order('created_at', { ascending: false }).limit(10),
        ]);

      const rows = (profiles ?? []) as unknown as Row[];
      setPeople(rows);
      setRoleCounts(rows.reduce<Record<string, number>>((acc, r) => {
        const k = r.role || 'student';
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {}));
      setQuizzes(quizCount ?? 0);
      setLessons(lessonCount ?? 0);
      setFocusMinutes((focus ?? []).reduce((s: number, f: any) => s + (f.focus_minutes ?? 0), 0));
      setAlerts((alertRows ?? []) as unknown as Alert[]);
      setMaterials(await listRepository());
    } catch (e) {
      toast.error((e as Error).message || 'Could not load the console');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id;
      if (!uid) { setChecking(false); return; }
      const { data } = await supabase.rpc('is_platform_admin', { _user_id: uid });
      setIsAdmin(Boolean(data));
      setChecking(false);
      if (data) void load();
    })();
  }, [load]);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadToRepository({ file, subject: subject || null, isPublic: true, source: 'admin' });
      }
      toast.success(`${files.length} material${files.length > 1 ? 's' : ''} added for everyone`);
      setMaterials(await listRepository());
    } catch (e) {
      toast.error((e as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (checking) return <div className="flex min-h-[50vh] items-center justify-center"><LogoLoader text="Checking access..." /></div>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16">
        <EmptyState
          icon={ShieldCheck}
          title="Administrators only"
          description="Sign in with your administrator account to open the monitoring console."
        />
      </div>
    );
  }

  const stats = [
    { label: 'People', value: people.length, icon: Users },
    { label: 'Quizzes taken', value: quizzes, icon: BookOpen },
    { label: 'Lessons done', value: lessons, icon: FileText },
    { label: 'Focus minutes', value: focusMinutes, icon: Timer },
  ];

  return (
    <div className="space-y-5">
      <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Admin console</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor who has joined, what they are doing, system alerts — and add materials everyone can use.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />} Refresh
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="rounded-2xl border-border/50 p-4">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="mt-2 text-2xl font-bold">{s.value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl border-border/50 p-4">
        <h2 className="text-sm font-semibold">Add materials for everyone</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="h-9 w-48 rounded-full text-sm"
          />
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => onUpload(e.target.files)} />
          <Button className="rounded-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload materials'}
          </Button>
        </div>
        <div className="mt-3 space-y-1.5">
          {materials.slice(0, 8).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm">
              <span className="truncate">{m.title}</span>
              <Badge variant="secondary" className="rounded-full text-[10px]">{m.kind}</Badge>
            </div>
          ))}
          {!materials.length && <p className="text-xs text-muted-foreground">No shared materials yet.</p>}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/50 p-4">
          <h2 className="text-sm font-semibold">People by role</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(roleCounts).map(([r, n]) => (
              <Badge key={r} variant="secondary" className="rounded-full capitalize">{r}: {n}</Badge>
            ))}
            {!people.length && <p className="text-xs text-muted-foreground">Nobody has signed up yet.</p>}
          </div>
          <div className="mt-4 space-y-1.5">
            {people.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                <span className="truncate">{p.full_name || 'Unnamed'}</span>
                <span className="shrink-0 text-xs capitalize text-muted-foreground">
                  {p.role || 'student'} · {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border-border/50 p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> System alerts
          </h2>
          <div className="mt-3 space-y-1.5">
            {alerts.map((a) => (
              <div key={a.id} className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                <div className="truncate font-medium">{a.title || a.message || 'Alert'}</div>
                <div className="text-xs text-muted-foreground">
                  {a.severity ? `${a.severity} · ` : ''}{new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {!alerts.length && <p className="text-xs text-muted-foreground">Nothing to worry about — no alerts.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminConsolePage;
