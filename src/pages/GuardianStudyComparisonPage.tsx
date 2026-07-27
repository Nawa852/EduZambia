import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Clock, Inbox } from 'lucide-react';
import { LogoLoader } from '@/components/UI/LogoLoader';

const GuardianStudyComparisonPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: links } = await (supabase as any).from('guardian_links').select('student_id').eq('guardian_id', user.id).eq('status', 'active');
      if (!links?.length) { setLoading(false); return; }
      const ids = links.map((l: any) => l.student_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      const { data: sessions } = await (supabase as any).from('focus_sessions').select('user_id, focus_minutes').in('user_id', ids);
      const { data: completions } = await supabase.from('lesson_completions').select('user_id').in('user_id', ids);
      const { data: quizzes } = await supabase.from('quiz_attempts').select('user_id, correct_answers, total_questions').in('user_id', ids);

      const chart = (profiles || []).map(p => {
        const mins = (sessions || []).filter((s: any) => s.user_id === p.id).reduce((sum: number, s: any) => sum + s.focus_minutes, 0);
        const lessons = (completions || []).filter(c => c.user_id === p.id).length;
        const qAttempts = (quizzes || []).filter(q => q.user_id === p.id);
        const avgQuiz = qAttempts.length ? Math.round(qAttempts.reduce((s, q) => s + (q.correct_answers / q.total_questions) * 100, 0) / qAttempts.length) : 0;
        return { name: p.full_name?.split(' ')[0] || 'Child', focus_hours: Math.round(mins / 60 * 10) / 10, lessons, quiz_avg: avgQuiz };
      });
      setData(chart);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="max-w-3xl mx-auto py-12 px-4"><LogoLoader text="Loading..." /></div>;

  if (!data.length) return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6"><Users className="w-6 h-6 text-primary" /> Study Comparison</h1>
      <Card><CardContent className="py-16 text-center"><Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" /><p className="font-medium">No linked children</p></CardContent></Card>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Study Comparison</h1>
        <p className="text-sm text-muted-foreground">Compare study activity across your children</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Focus Hours</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="focus_hours" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Lessons Completed</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="lessons" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Average Quiz Score (%)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="quiz_avg" fill="hsl(var(--chart-3))" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuardianStudyComparisonPage;
