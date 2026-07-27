import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProgress, deleteProgress, type ProgressSnapshot } from '@/lib/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { History, Trash2, Play } from 'lucide-react';

const ROUTE_FOR: Record<string, string> = {
  chat: '/ai-chat',
  artifact: '/ai/artifacts',
  study_pack: '/study',
  quiz: '/ai-quiz-generator',
  homework: '/homework-solver',
  exam_predictor: '/exam-predictor',
  voice_note: '/lecture-recording',
  flashcards: '/ai-flashcards',
  tutor: '/ai-tutor',
};

const LABEL_FOR: Record<string, string> = {
  chat: 'Chat', artifact: 'Artifact', study_pack: 'Study pack', quiz: 'Quiz',
  homework: 'Homework', exam_predictor: 'Exam predictor', voice_note: 'Voice note',
  flashcards: 'Flashcards', tutor: 'Tutor',
};

/** Resume list — every saved AI workspace / study session in one place. */
const SavedProgressList: React.FC<{ kind?: string; limit?: number }> = ({ kind, limit = 12 }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ProgressSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await listProgress(kind, limit));
    setLoading(false);
  }, [kind, limit]);

  useEffect(() => { void load(); }, [load]);

  const remove = async (id: string) => {
    if (await deleteProgress(id)) setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>;

  if (items.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed">
        <CardContent className="py-10 text-center space-y-2">
          <History className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Nothing saved yet</p>
          <p className="text-xs text-muted-foreground">Your chats, artifacts and study packs will appear here so you can pick up where you left off.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <Card key={item.id} className="rounded-2xl border-border/50 hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5 flex items-center gap-3">
            <button
              className="flex-1 min-w-0 text-left"
              onClick={() => navigate(`${ROUTE_FOR[item.kind] ?? '/ai-workspace'}?resume=${encodeURIComponent(item.ref_key)}`)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full text-[10px]">{LABEL_FOR[item.kind] ?? item.kind}</Badge>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(item.updated_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium truncate text-foreground">{item.title}</p>
              {item.progress > 0 && <Progress value={item.progress} className="h-1 mt-2" />}
            </button>
            <button
              onClick={() => navigate(`${ROUTE_FOR[item.kind] ?? '/ai-workspace'}?resume=${encodeURIComponent(item.ref_key)}`)}
              className="p-2 text-primary" aria-label="Resume"
            >
              <Play className="w-4 h-4" />
            </button>
            <button onClick={() => remove(item.id)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Delete saved progress">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SavedProgressList;
