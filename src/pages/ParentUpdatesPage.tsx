import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, MailOpen, Sparkles, Inbox } from 'lucide-react';

interface Update {
  id: string;
  subject: string | null;
  body: string;
  ai_generated: boolean;
  sent_at: string | null;
  created_at: string;
  read_at: string | null;
  student_id: string;
  teacher_id: string;
}

/** Teacher → parent updates, read where parents already are. */
const ParentUpdatesPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['parent-updates', user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data: updates } = await supabase
        .from('parent_updates')
        .select('id, subject, body, ai_generated, sent_at, created_at, read_at, student_id, teacher_id')
        .eq('parent_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const rows = (updates ?? []) as Update[];
      const ids = [...new Set(rows.flatMap((r) => [r.student_id, r.teacher_id]).filter(Boolean))];
      const { data: people } = ids.length
        ? await supabase.from('profiles').select('id, full_name').in('id', ids)
        : { data: [] as { id: string; full_name: string }[] };
      const names = new Map((people ?? []).map((p) => [p.id, p.full_name || 'Teacher']));
      return rows.map((r) => ({
        ...r,
        teacherName: names.get(r.teacher_id) ?? 'Teacher',
        studentName: names.get(r.student_id) ?? 'Your child',
      }));
    },
  });

  const open = async (id: string, unread: boolean) => {
    setOpenId((c) => (c === id ? null : id));
    if (unread) {
      await supabase.from('parent_updates').update({ read_at: new Date().toISOString() }).eq('id', id);
      qc.invalidateQueries({ queryKey: ['parent-updates', user?.id] });
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-10 text-center space-y-2">
          <Inbox className="w-9 h-9 mx-auto text-muted-foreground" />
          <p className="font-medium">No updates yet</p>
          <p className="text-sm text-muted-foreground">
            When your child's teachers send a progress note, it lands here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = data.filter((u) => !u.read_at).length;

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <p className="text-xs text-muted-foreground">{unreadCount} unread update{unreadCount > 1 ? 's' : ''}</p>
      )}
      {data.map((u) => {
        const unread = !u.read_at;
        const expanded = openId === u.id;
        return (
          <Card key={u.id} className={`rounded-2xl border-border/60 ${unread ? 'bg-primary/[0.04]' : ''}`}>
            <CardContent className="p-4">
              <button className="w-full text-left" onClick={() => open(u.id, unread)}>
                <div className="flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${unread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {unread ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-tight truncate">{u.subject || 'Progress update'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {u.teacherName} · about {u.studentName} · {new Date(u.sent_at || u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {u.ai_generated && (
                    <Badge variant="secondary" className="rounded-full gap-1 shrink-0"><Sparkles className="w-3 h-3" /> AI</Badge>
                  )}
                </div>
              </button>
              {expanded && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-3 pl-12">{u.body}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ParentUpdatesPage;
