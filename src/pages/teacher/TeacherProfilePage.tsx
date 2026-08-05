import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StarFavoriteButton } from '@/components/UI/StarFavoriteButton';
import {
  ClipboardCheck, Sparkles, User, Users, BookOpen, Library, GraduationCap, Award, ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity { id: string; label: string; detail: string; at: string }

const TeacherProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [stats, setStats] = useState({ classes: 0, students: 0, resources: 0, ungraded: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const [{ data: classes }, { data: specs }, { data: resources }] = await Promise.all([
        supabase.from('classes').select('id, name, subject, created_at').eq('teacher_id', user.id).eq('archived', false),
        supabase.from('teacher_specializations').select('subject').eq('user_id', user.id),
        supabase.from('resource_repository').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      const classIds = (classes ?? []).map((c) => c.id);
      const { count: studentCount } = classIds.length
        ? await supabase.from('class_enrollments').select('id', { count: 'exact', head: true }).in('class_id', classIds).eq('status', 'active')
        : { count: 0 };

      const { data: courses } = await supabase.from('courses').select('id').eq('created_by', user.id);
      let ungraded = 0;
      if (courses?.length) {
        const { data: assignments } = await supabase.from('assignments').select('id').in('course_id', courses.map((c) => c.id));
        if (assignments?.length) {
          const { count } = await supabase
            .from('submissions').select('id', { count: 'exact', head: true })
            .in('assignment_id', assignments.map((a) => a.id)).is('graded_at', null);
          ungraded = count ?? 0;
        }
      }

      const subjectSet = new Set<string>();
      (specs ?? []).forEach((s) => s.subject && subjectSet.add(s.subject));
      (classes ?? []).forEach((c) => c.subject && subjectSet.add(c.subject));
      setSubjects([...subjectSet]);

      setStats({
        classes: classes?.length ?? 0,
        students: studentCount ?? 0,
        resources: resources?.length ?? 0,
        ungraded,
      });

      setActivity([
        ...(classes ?? []).slice(0, 3).map((c) => ({
          id: `c-${c.id}`, label: 'Class created', detail: c.name, at: c.created_at as string,
        })),
        ...(resources ?? []).slice(0, 3).map((r) => ({
          id: `r-${r.id}`, label: 'Resource uploaded', detail: r.title, at: r.created_at as string,
        })),
      ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 6));

      setLoading(false);
    })();
  }, [user]);

  const quickLinks = [
    { label: 'Teach', description: 'Classes, marking, attendance', href: '/teach', icon: ClipboardCheck },
    { label: 'Co-Pilot', description: 'Plans, tests and marking help', href: '/teacher/copilot', icon: Sparkles },
    { label: 'Library', description: 'Shared plans, notes and papers', href: '/library', icon: Library },
    { label: 'Me', description: 'Account and settings', href: '/profile', icon: User },
  ];

  const initials = (profile?.full_name || 'Teacher').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/15 text-primary flex items-center justify-center text-xl font-semibold">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{profile?.full_name || 'Teacher'}</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.school || 'Synapse Teacher'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {subjects.length ? subjects.map((s) => (
                  <Badge key={s} variant="secondary" className="rounded-full text-[11px]">{s}</Badge>
                )) : (
                  <span className="text-xs text-muted-foreground">Add subjects in Professional Development</span>
                )}
              </div>
            </div>
          </div>
          <StarFavoriteButton label="Teacher World" url="/teacher/profile" icon="GraduationCap" />
        </div>
      </header>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active classes', value: stats.classes, icon: Users },
          { label: 'Students', value: stats.students, icon: GraduationCap },
          { label: 'Waiting to mark', value: stats.ungraded, icon: ClipboardCheck },
          { label: 'My resources', value: stats.resources, icon: BookOpen },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border-border/60">
            <CardContent className="p-4">
              <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
              <p className="text-2xl font-semibold tracking-tight">
                {loading ? <Skeleton className="h-7 w-10" /> : s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((l) => (
          <Link key={l.href} to={l.href}>
            <Card className="rounded-2xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <l.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{l.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Recent activity</h2>
          </div>
          {loading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet. Create a class or upload a resource and it will show up here.
            </p>
          ) : (
            <div className="space-y-2">
              {activity.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.detail}</p>
                    <p className="text-xs text-muted-foreground">{a.label}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(a.at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/teacher-specialization">Professional development</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/teach?tab=grading-queue">Open grading queue</Link>
        </Button>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
