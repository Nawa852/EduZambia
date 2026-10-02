import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, GraduationCap, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/hooks/useSchool';

interface Command {
  learners: number; teachers: number; guardian_linked: number; plans_7d: number;
  teacher_activity: { name: string; plans: number; mastery_entries: number }[];
  weak_competences: { code: string; title: string | null; rate: number; n: number }[];
}

/** School "Command": guardian coverage, teacher planning activity, weakest competences. */
export const SchoolCommandPanel: React.FC = () => {
  const { school, isOwner, loading } = useSchool();
  const navigate = useNavigate();
  const [cmd, setCmd] = useState<Command | null>(null);

  useEffect(() => {
    if (!school || !isOwner) return;
    (supabase as any).rpc('get_school_command', { _school_id: school.id }).then(({ data }: { data: Command | null }) => setCmd(data));
  }, [school, isOwner]);

  if (loading) return null;
  if (!school) {
    return (
      <Card className="flex flex-wrap items-center gap-3 rounded-2xl border-border/50 p-4">
        <Building2 className="h-5 w-5 text-primary" />
        <div className="flex-1 text-sm"><div className="font-semibold">Set up your school</div><div className="text-xs text-muted-foreground">Add your logo and get staff and learner codes.</div></div>
        <Button size="sm" className="rounded-full" onClick={() => navigate('/school/settings')}>Start</Button>
      </Card>
    );
  }
  if (!isOwner || !cmd) return null;

  const coverage = cmd.learners ? Math.round((100 * cmd.guardian_linked) / cmd.learners) : 0;
  const stats = [
    { label: 'Learners', v: cmd.learners, icon: GraduationCap },
    { label: 'Teachers', v: cmd.teachers, icon: Users },
    { label: 'Plans this week', v: cmd.plans_7d, icon: FileText },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/50 p-3">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <div className="mt-1 text-xl font-bold">{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/50 p-4">
          <h3 className="text-sm font-semibold">Parent coverage</h3>
          <div className="mt-1 text-2xl font-bold">{coverage}%</div>
          <Progress value={coverage} className="mt-2 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{cmd.guardian_linked} of {cmd.learners} learners have a linked parent.</p>
          <Button size="sm" variant="outline" className="mt-2 rounded-full" onClick={() => navigate('/school/settings')}>School codes</Button>
        </Card>
        <Card className="rounded-2xl border-border/50 p-4">
          <h3 className="mb-2 text-sm font-semibold">Teacher activity (30 days)</h3>
          {cmd.teacher_activity.length ? cmd.teacher_activity.map((t) => (
            <div key={t.name} className="flex justify-between py-1 text-sm"><span className="truncate">{t.name}</span><span className="text-xs text-muted-foreground">{t.plans} plans · {t.mastery_entries} marks</span></div>
          )) : <p className="text-xs text-muted-foreground">Share the staff code so teachers can join.</p>}
        </Card>
        <Card className="rounded-2xl border-border/50 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-warning" />Weakest competences</h3>
          {cmd.weak_competences.length ? cmd.weak_competences.map((w) => (
            <div key={w.code} className="py-1 text-sm"><span className="font-mono text-xs">{w.code}</span> {w.title} <span className="text-xs text-muted-foreground">· {w.rate}% mastered</span></div>
          )) : <p className="text-xs text-muted-foreground">Appears once teachers start entering mastery.</p>}
        </Card>
      </div>
    </div>
  );
};

export default SchoolCommandPanel;
