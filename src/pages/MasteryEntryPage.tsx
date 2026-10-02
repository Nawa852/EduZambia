import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/UI/EmptyState';
import { CurriculumPicker, type CurriculumSelection } from '@/components/Curriculum/CurriculumPicker';
import { Check, X, Link2, Loader2, Users, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

interface ClassRow { id: string; name: string; grade: string | null; subject: string | null }
interface RosterRow { student_id: string; full_name: string; guardian_linked: boolean; mastered_count: number; entries_count: number }

const db = supabase as any;

/** After a lesson: mark each learner mastered / not yet for one competence. Also shows who has a linked parent. */
const MasteryEntryPage: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState('');
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [sel, setSel] = useState<CurriculumSelection | null>(null);
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    if (!user) return;
    db.from('classes').select('id, name, grade, subject').eq('teacher_id', user.id).eq('archived', false).order('name')
      .then(({ data }: { data: ClassRow[] | null }) => { setClasses(data ?? []); if (data?.[0]) setClassId(data[0].id); });
  }, [user]);

  const loadRoster = useCallback(async () => {
    if (!classId) return;
    setLoadingRoster(true);
    const { data, error } = await db.rpc('get_class_roster', { _class_id: classId });
    setLoadingRoster(false);
    if (error) { toast.error(error.message); return; }
    setRoster(data ?? []); setMarks({});
  }, [classId]);
  useEffect(() => { void loadRoster(); }, [loadRoster]);

  const comp = sel?.competence;

  const save = async () => {
    if (!comp) { toast.error('Pick the competence you taught'); return; }
    const rows = Object.entries(marks).map(([student_id, mastered]) => ({
      class_id: classId, student_id, teacher_id: user!.id, competence_code: comp.code, competence_title: comp.title, mastered,
    }));
    if (!rows.length) { toast.error('Tap at least one learner'); return; }
    setSaving(true);
    const { error } = await db.from('mastery_entries').upsert(rows, { onConflict: 'class_id,student_id,competence_code,lesson_date' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Saved ${rows.length} mastery marks`);
    void loadRoster();
  };

  const invite = async (studentId: string) => {
    const { data, error } = await db.rpc('create_parent_invite_for_student', { _student_id: studentId });
    if (error) { toast.error(error.message); return; }
    await navigator.clipboard.writeText(`${window.location.origin}/parents/join/${data}`);
    toast.success('Parent invite link copied');
  };

  const linked = roster.filter((r) => r.guardian_linked).length;

  if (!classes.length) {
    return <div className="mx-auto max-w-md py-12"><EmptyState icon={Users} title="No classes yet" description="Create a class first, then learners join with its code." /></div>;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 rounded-2xl border-border/50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-9 w-56 rounded-full"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Badge variant="secondary" className="rounded-full">{linked}/{roster.length} parents linked</Badge>
        </div>
        <CurriculumPicker onChange={setSel} />
        {comp && <p className="text-xs text-muted-foreground">Marking <span className="font-semibold text-foreground">{comp.code}</span> — {comp.title}</p>}
      </Card>

      {loadingRoster ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !roster.length ? (
        <EmptyState icon={Users} title="No learners in this class" description="Share the class code so learners can join." />
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => setMarks(Object.fromEntries(roster.map((r) => [r.student_id, true])))}>All mastered</Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setMarks({})}>Clear</Button>
          </div>
          {roster.map((r) => {
            const m = marks[r.student_id];
            return (
              <Card key={r.student_id} className="flex items-center gap-3 rounded-2xl border-border/50 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.full_name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {r.entries_count ? `${r.mastered_count}/${r.entries_count} mastered` : 'No marks yet'}
                    {r.guardian_linked
                      ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" />Parent linked</span>
                      : <button className="flex items-center gap-1 text-primary underline-offset-2 hover:underline" onClick={() => invite(r.student_id)}><Link2 className="h-3 w-3" />Invite parent</button>}
                  </div>
                </div>
                <Button size="lg" variant={m === true ? 'default' : 'outline'} className="h-11 w-11 rounded-full p-0" aria-label={`${r.full_name} mastered`} onClick={() => setMarks((p) => ({ ...p, [r.student_id]: true }))}><Check className="h-5 w-5" /></Button>
                <Button size="lg" variant={m === false ? 'destructive' : 'outline'} className="h-11 w-11 rounded-full p-0" aria-label={`${r.full_name} not yet`} onClick={() => setMarks((p) => ({ ...p, [r.student_id]: false }))}><X className="h-5 w-5" /></Button>
              </Card>
            );
          })}
          <Button className="w-full rounded-full" size="lg" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save mastery ({Object.keys(marks).length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default MasteryEntryPage;
