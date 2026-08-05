import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Users, Copy, Upload, UserPlus, Archive, ArchiveRestore, Loader2, Trash2, GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

interface ClassRow {
  id: string;
  name: string;
  grade: string | null;
  subject: string | null;
  room: string | null;
  term: string | null;
  description: string | null;
  archived: boolean;
  join_code: string | null;
}

interface Enrollment {
  id: string;
  student_id: string;
  status: string;
  name: string;
}

interface Invite {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
}

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export const ClassManager: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', grade: '', subject: '', room: '', term: '', description: '' });

  const [active, setActive] = useState<ClassRow | null>(null);
  const [roster, setRoster] = useState<Enrollment[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const csvRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('classes')
      .select('id, name, grade, subject, room, term, description, archived, join_code')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    const rows = (data ?? []) as ClassRow[];
    setClasses(rows);

    if (rows.length) {
      const { data: enr } = await supabase
        .from('class_enrollments')
        .select('class_id, status')
        .in('class_id', rows.map((r) => r.id));
      const map: Record<string, number> = {};
      (enr ?? []).forEach((e) => {
        if (e.status === 'active') map[e.class_id] = (map[e.class_id] ?? 0) + 1;
      });
      setCounts(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(
    () => classes.filter((c) => (showArchived ? c.archived : !c.archived)),
    [classes, showArchived],
  );

  const createClass = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast.error('Give the class a name');
    setBusy(true);
    const { data, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: user.id,
        name: form.name.trim(),
        grade: form.grade || null,
        subject: form.subject || null,
        room: form.room || null,
        term: form.term || null,
        description: form.description || null,
      })
      .select('id')
      .single();
    if (!error && data) {
      await supabase.rpc('ensure_class_join_code', { _class_id: data.id });
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Class created');
    setCreateOpen(false);
    setForm({ name: '', grade: '', subject: '', room: '', term: '', description: '' });
    load();
  };

  const openClass = async (cls: ClassRow) => {
    setActive(cls);
    setRosterLoading(true);
    let code = cls.join_code;
    if (!code) {
      const { data } = await supabase.rpc('ensure_class_join_code', { _class_id: cls.id });
      code = (data as string) ?? null;
      setActive({ ...cls, join_code: code });
      setClasses((p) => p.map((c) => (c.id === cls.id ? { ...c, join_code: code } : c)));
    }

    const { data: enr } = await supabase
      .from('class_enrollments')
      .select('id, student_id, status')
      .eq('class_id', cls.id);

    const ids = (enr ?? []).map((e) => e.student_id);
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('id, full_name').in('id', ids)
      : { data: [] as { id: string; full_name: string | null }[] };
    const pMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name || 'Student']));

    setRoster((enr ?? []).map((e) => ({ ...e, name: pMap[e.student_id] ?? 'Student' })));

    const { data: inv } = await supabase
      .from('class_invites')
      .select('id, email, full_name, status')
      .eq('class_id', cls.id)
      .order('created_at', { ascending: false });
    setInvites((inv ?? []) as Invite[]);
    setRosterLoading(false);
  };

  const addInvites = async (rows: { email: string; full_name?: string }[]) => {
    if (!active || !rows.length) return;
    const { error } = await supabase.from('class_invites').insert(
      rows.map((r) => ({
        class_id: active.id,
        email: r.email.trim().toLowerCase(),
        full_name: r.full_name ?? null,
      })),
    );
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} student${rows.length > 1 ? 's' : ''} invited`);
    openClass(active);
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const rows = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [a, b] = line.split(',').map((s) => s?.trim());
        const email = /@/.test(a ?? '') ? a : b;
        const name = /@/.test(a ?? '') ? b : a;
        return email ? { email, full_name: name || undefined } : null;
      })
      .filter(Boolean) as { email: string; full_name?: string }[];
    if (!rows.length) return toast.error('No email addresses found in that file');
    addInvites(rows);
  };

  const setEnrollmentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('class_enrollments').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    setRoster((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Marked ${status}`);
  };

  const removeStudent = async (id: string) => {
    const { error } = await supabase.from('class_enrollments').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setRoster((p) => p.filter((r) => r.id !== id));
    toast.success('Removed from class');
  };

  const toggleArchive = async (cls: ClassRow) => {
    const { error } = await supabase.from('classes').update({ archived: !cls.archived }).eq('id', cls.id);
    if (error) return toast.error(error.message);
    toast.success(cls.archived ? 'Class restored' : 'Class archived');
    setActive(null);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">My classes</h2>
          <p className="text-sm text-muted-foreground">Create a class, share the join code, and manage who is in it.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Active classes' : 'Archived'}
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> New class</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create a class</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Class name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="10B Mathematics" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Room</Label>
                    <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Block C, Rm 4" />
                  </div>
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="Term 2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button onClick={createClass} disabled={busy} className="w-full rounded-xl">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create class'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-2">
            <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <h3 className="font-semibold">{showArchived ? 'No archived classes' : 'No classes yet'}</h3>
            <p className="text-sm text-muted-foreground">Create your first class to start inviting students.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((cls) => (
            <button
              key={cls.id}
              onClick={() => openClass(cls)}
              className="text-left rounded-2xl border border-border/60 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm">{cls.name}</h3>
                {cls.archived && <Badge variant="secondary" className="text-[10px] rounded-full">Archived</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {[cls.grade, cls.subject, cls.term].filter(Boolean).join(' · ') || 'No details yet'}
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {counts[cls.id] ?? 0} student{(counts[cls.id] ?? 0) === 1 ? '' : 's'}
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {active && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{active.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {[active.grade, active.subject, active.room, active.term].filter(Boolean).join(' · ')}
                </p>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                <Card className="rounded-2xl bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Join code — students enter this to be added</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-semibold tracking-widest">{active.join_code ?? '——————'}</span>
                      <Button
                        size="sm" variant="outline" className="rounded-xl gap-1.5 ml-auto"
                        onClick={() => {
                          navigator.clipboard.writeText(active.join_code ?? '');
                          toast.success('Join code copied');
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Invite a student by email</Label>
                  <div className="flex gap-2">
                    <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="student@school.zm"
                      className="rounded-xl"
                    />
                    <Button
                      className="rounded-xl gap-1.5"
                      onClick={() => {
                        if (!/@/.test(inviteEmail)) return toast.error('Enter a valid email');
                        addInvites([{ email: inviteEmail }]);
                        setInviteEmail('');
                      }}
                    >
                      <UserPlus className="w-4 h-4" /> Invite
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => csvRef.current?.click()}>
                    <Upload className="w-4 h-4" /> Import roster (CSV: name, email)
                  </Button>
                  <input
                    ref={csvRef} type="file" accept=".csv,text/csv" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Roster ({roster.length})</h4>
                  {rosterLoading ? (
                    <Skeleton className="h-20 rounded-xl" />
                  ) : roster.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students have joined yet. Share the code above.</p>
                  ) : (
                    roster.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 rounded-xl border border-border/50 p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{r.status}</p>
                        </div>
                        <Select value={r.status} onValueChange={(v) => setEnrollmentStatus(r.id, v)}>
                          <SelectTrigger className="w-[120px] h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeStudent(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {invites.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Pending invites ({invites.length})</h4>
                    {invites.map((i) => (
                      <div key={i.id} className="flex items-center gap-2 rounded-xl border border-border/50 p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{i.full_name || i.email}</p>
                          {i.full_name && <p className="text-xs text-muted-foreground truncate">{i.email}</p>}
                        </div>
                        <Badge variant="secondary" className="rounded-full text-[10px] capitalize">{i.status}</Badge>
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                          onClick={async () => {
                            await supabase.from('class_invites').delete().eq('id', i.id);
                            setInvites((p) => p.filter((x) => x.id !== i.id));
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => toggleArchive(active)}>
                  {active.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  {active.archived ? 'Restore class' : 'Archive class'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClassManager;
