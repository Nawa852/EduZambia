import React, { useEffect, useState } from 'react';
import { Activity, BookOpen, Brain, Timer, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeedItem {
  id: string;
  type: 'lesson' | 'quiz' | 'focus';
  description: string;
  timestamp: string;
  icon: typeof BookOpen;
}

const GuardianActivityFeedPage = () => {
  const { user } = useAuth();
  const [liveFeed, setLiveFeed] = useState<FeedItem[]>([]);

  const { data: studentIds } = useQuery({
    queryKey: ['guardian-students', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('guardian_links').select('student_id').eq('guardian_id', user!.id).in('status', ['active','accepted']);
      return data?.map(d => d.student_id) || [];
    },
    enabled: !!user,
  });

  const { data: initialFeed } = useQuery({
    queryKey: ['guardian-feed', studentIds],
    queryFn: async () => {
      if (!studentIds?.length) return [];
      const items: FeedItem[] = [];

      const { data: lessons } = await supabase.from('lesson_completions').select('id, completed_at, user_id').in('user_id', studentIds).order('completed_at', { ascending: false }).limit(10);
      lessons?.forEach(l => items.push({ id: l.id, type: 'lesson', description: 'Completed a lesson', timestamp: l.completed_at, icon: BookOpen }));

      const { data: quizzes } = await supabase.from('quiz_attempts').select('id, created_at, subject, correct_answers, total_questions, user_id').in('user_id', studentIds).order('created_at', { ascending: false }).limit(10);
      quizzes?.forEach(q => items.push({ id: q.id, type: 'quiz', description: `Scored ${q.correct_answers}/${q.total_questions} in ${q.subject}`, timestamp: q.created_at, icon: Brain }));

      const { data: focus } = await supabase.from('focus_sessions').select('id, started_at, focus_minutes, subject, user_id').in('user_id', studentIds).order('started_at', { ascending: false }).limit(10);
      focus?.forEach(f => items.push({ id: f.id, type: 'focus', description: `${f.focus_minutes}min focus session on ${f.subject}`, timestamp: f.started_at, icon: Timer }));

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
    },
    enabled: !!studentIds?.length,
  });

  useEffect(() => {
    if (!studentIds?.length) return;
    const channel = supabase.channel('guardian-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lesson_completions' }, (p) => {
        if (studentIds.includes(p.new.user_id)) {
          setLiveFeed(prev => [{ id: p.new.id, type: 'lesson' as const, description: 'Completed a lesson', timestamp: p.new.completed_at, icon: BookOpen }, ...prev].slice(0, 5));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_attempts' }, (p) => {
        if (studentIds.includes(p.new.user_id)) {
          setLiveFeed(prev => [{ id: p.new.id, type: 'quiz' as const, description: `Quiz: ${p.new.correct_answers}/${p.new.total_questions} in ${p.new.subject}`, timestamp: p.new.created_at, icon: Brain }, ...prev].slice(0, 5));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentIds]);

  const allFeed = [...liveFeed, ...(initialFeed || [])];
  const typeColors = { lesson: 'bg-green-500/10 text-green-600', quiz: 'bg-blue-500/10 text-blue-600', focus: 'bg-orange-500/10 text-orange-600' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" /> Activity Feed
        </h1>
        <p className="text-muted-foreground mt-1">Real-time updates on your child's learning activities</p>
      </div>

      {liveFeed.length > 0 && (
        <Badge className="bg-green-500/10 text-green-600 animate-pulse">
          <Zap className="h-3 w-3 mr-1" /> Live updates
        </Badge>
      )}

      <div className="space-y-3">
        {allFeed.length > 0 ? allFeed.map(item => (
          <Card key={item.id} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${typeColors[item.type]}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
            </CardContent>
          </Card>
        )) : (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No activity yet. Activities will appear here as your child uses the platform.</CardContent></Card>
        )}
      </div>
    </div>
  );
};

export default GuardianActivityFeedPage;
